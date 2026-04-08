/**
 * LearningAgent - Intelligent Router for Learning Platform
 * 
 * Analyzes user messages and automatically selects the appropriate tool:
 * - quizTool: For quiz generation requests
 * - ragTool: For PDF/document chat requests  
 * - analyticsTool: For progress/performance queries
 * 
 * Uses Gemini for intelligent routing via function calling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { quizTool, quizToolSchema } from './tools/quizTool.js';
import { ragTool, ragToolSchema, checkPdfStatus } from './tools/ragTool.js';
import { analyticsTool, analyticsToolSchema } from './tools/analyticsTool.js';
import { 
  contentTool, 
  personalizedContentTool, 
  quizFromTextTool,
  contentToolSchema, 
  personalizedContentToolSchema,
  quizFromTextToolSchema 
} from './tools/contentTool.js';
import {
  evaluateLearningStyleTool,
  evaluateAnswerTool,
  validateContentTool,
  evaluateLearningStyleToolSchema,
  evaluateAnswerToolSchema,
  validateContentToolSchema
} from './tools/validationTool.js';

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

console.log("LearningAgent module loaded, Gemini:", !!genAI);

/**
 * Retry helper with exponential backoff
 */
async function withRetry(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, RETRY_DELAY * (i + 1)));
    }
  }
}

/**
 * Check if message is about PDF chat/explanation
 * @param {string} message - User's message
 * @returns {boolean}
 */
function isPdfChat(message) {
  const lower = message.toLowerCase();
  
  // Check for PDF-related keywords
  const hasPdfKeyword = /\b(pdf|document)\b/i.test(lower);
  const hasExplainKeyword = /\b(explain|summarize|tell me about|what is|discuss|read|chat with)\b/i.test(lower);
  
  // If message contains PDF/document AND explain/summarize/tell me about keywords
  // OR if it's a direct PDF chat request
  const pdfChatPatterns = [
    /explain\s+(pdf|this|the|my)/i,
    /summarize\s+(pdf|this|document)/i,
    /tell\s+me\s+about\s+(this|the|my)\s*(pdf|document)/i,
    /what\s+is\s+in\s+(this|the)\s*(pdf|document)/i,
    /what\s+does\s+(this|the)\s*(pdf|document|content)\s+say/i,
    /read\s+(this|my|the)\s*(pdf|document)/i,
    /chat\s+with\s+(this|my|the)\s*(pdf|document)/i,
    /discuss\s+(this|my|the)\s*(pdf|document)/i,
    /explain\s+pdf/i,
    /summarize\s+pdf/i,
    /pdf\s+summary/i,
    /document\s+summary/i
  ];
  
  // Check if message matches any PDF chat pattern
  const matchesPattern = pdfChatPatterns.some(pattern => pattern.test(lower));
  
  // Also check for simple "explain PDF" or "summarize document" type messages
  const simpleMatch = (hasPdfKeyword && hasExplainKeyword) || 
                     (/\bexplain\b/i.test(lower) && /\b(pdf|document)\b/i.test(lower)) ||
                     (/\bsummarize\b/i.test(lower) && /\b(pdf|document)\b/i.test(lower));
  
  return matchesPattern || simpleMatch;
}

/**
 * Check if message is about quiz generation from document/PDF
 * @param {string} message - User's message
 * @returns {boolean}
 */
function isQuizFromDocument(message) {
  const lower = message.toLowerCase();
  const quizFromDocPatterns = [
    /quiz.*from.*(document|pdf|file)/i,
    /generate.*quiz.*from.*(document|pdf|file)/i,
    /create.*quiz.*from.*(document|pdf|file)/i,
    /quiz.*based.*on.*(document|pdf)/i,
    /test.*from.*(document|pdf)/i,
    /practice.*from.*(document|pdf)/i,
    /quiz.*this.*(document|pdf)/i,
    /generate.*quiz.*pdf/i,
    /quiz.*from.*upload/i
  ];
  
  return quizFromDocPatterns.some(pattern => pattern.test(lower));
}

/**
 * Split text into chunks for processing large PDFs
 * @param {string} text - Text to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {string[]}
 */
function splitTextIntoChunks(text, chunkSize = 8000) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    // Try to split at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const boundary = Math.max(lastPeriod, lastNewline);
      if (boundary > start) {
        end = boundary + 1;
      }
    }
    chunks.push(text.substring(start, end).trim());
    start = end;
  }
  
  return chunks;
}

/**
 * Generate quiz from PDF text using Gemini directly with chunking
 * @param {Object} params - Parameters
 * @param {string} params.pdfText - Extracted PDF text
 * @param {string} params.topic - Optional topic
 * @returns {Promise<Object>} Quiz data
 */
async function generateQuizFromPdfWithGemini({ pdfText, topic }) {
  console.log("📝 generateQuizFromPdfWithGemini called, text length:", pdfText?.length);
  
  if (!pdfText || pdfText.length < 200) {
    return {
      success: false,
      error: 'Not enough PDF content to generate quiz',
      message: 'The document appears to be too short or empty to generate a quiz.'
    };
  }

  // Check if text is large and needs chunking
  const needsChunking = pdfText.length > 1000;
  let questions = [];
  
  if (needsChunking) {
    console.log("📄 Large PDF detected, splitting into chunks...");
    const chunks = splitTextIntoChunks(pdfText, 8000);
    console.log(`✂️ Split into ${chunks.length} chunks`);
    
    const allChunkQuestions = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkQuestions = await withRetry(() => 
          generateQuestionsFromChunk(chunks[i], i + 1, chunks.length)
        );
        if (chunkQuestions && Array.isArray(chunkQuestions)) {
          allChunkQuestions.push(...chunkQuestions);
        }
      } catch (chunkError) {
        console.error(`❌ Failed to generate questions from chunk ${i + 1}:`, chunkError.message);
      }
    }
    
    if (allChunkQuestions.length === 0) {
      throw new Error('Failed to generate questions from PDF');
    }
    
    // Merge and deduplicate questions
    questions = mergeAndDeduplicateQuestions(allChunkQuestions);
  } else {
    // Small text - no chunking needed
    questions = await withRetry(() => generateQuestionsFromChunk(pdfText, 1, 1));
  }
  
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      success: false,
      error: 'Failed to generate questions',
      message: 'Could not generate quiz questions from the document. Please try again.'
    };
  }

  // Take up to 10 questions
  const finalQuestions = questions.slice(0, 10).map((q, idx) => ({
    originalIndex: idx,
    question: q.question,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.answer || '',
    explanation: q.explanation || '',
    category: q.category || ''
  }));

  return {
    success: true,
    tool: 'quiz',
    data: {
      questions: finalQuestions,
      topic: topic || 'Document Quiz',
      source: 'pdf',
      questionCount: finalQuestions.length
    },
    message: `Generated a quiz with ${finalQuestions.length} questions from your document`
  };
}

/**
 * Generate questions from a single chunk using Gemini
 */
async function generateQuestionsFromChunk(chunk, chunkNum, totalChunks) {
  console.log(`🚀 Generating questions from chunk ${chunkNum}/${totalChunks}, length: ${chunk.length}`);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `
Your task is to convert document/PDF content into SKILL TESTING questions.

VERY IMPORTANT - YOU MUST INCLUDE THESE FIELDS FOR EACH QUESTION:
1. question - The question text
2. options - Array of 4 options (full text, not just letters)
3. answer - The correct answer (MUST be the full text from options, e.g., "Option A")
4. explanation - A detailed explanation of why the answer is correct (MUST be included)
5. category - The technical category (MUST be included)

🚨🚨🚨 CRITICAL EXPLANATION RULES - FOLLOW STRICTLY 🚨🚨🚨

1. NEVER say "The correct answer is" or quote the answer text
2. NEVER say "Option X is correct" or "This option is correct"
3. NEVER say "This assesses your knowledge"
4. ALWAYS explain the CONCEPT purely (what it is, how it works)
5. ALWAYS explain WHY the correct option works (the technical reasoning)
6. Do NOT repeat or quote the answer text in the explanation
7. Keep to exactly 2 sentences

📝 EXPLANATION FORMAT:
Explain the concept first, then explain why the correct option works. Don't mention which option is correct.

✅ CORRECT FORMAT:
"JWT enables secure identity exchange by embedding signed information in a token, allowing the server to verify authenticity without maintaining session state."

❌ WRONG - DO NOT USE:
"The correct answer is JWT because it securely transmits identity."
"Option A is correct because it allows stateless authentication."
"This assesses your understanding of authentication tokens."

RULES:
1. Generate exactly 10 MCQs from this chunk
2. Each question must test real knowledge
3. No biography questions
4. No personal references
5. Return ONLY valid JSON
6. No extra text
7. If this is chunk ${chunkNum} of ${totalChunks}, focus on content from this section

REQUIRED JSON FORMAT:
[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "[Explain the concept in 1 sentence]. [Explain why this works - the technical reason].",
    "category": "Category Name"
  }
]

CONTENT TO ANALYZE (Chunk ${chunkNum}/${totalChunks}):
${chunk}
`;

  const result = await model.generateContent(prompt);
  let rawText = result.response.text();
  
  if (!rawText) {
    throw new Error("Empty Gemini output");
  }

  // Clean up the response - Gemini often returns markdown-wrapped JSON
  rawText = rawText.trim();
  
  // Remove markdown code blocks if present
  if (rawText.startsWith("```json")) {
    rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Also handle cases where there's text before/after the JSON
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    rawText = jsonMatch[0];
  }

  const parsed = JSON.parse(rawText);
  console.log(`✅ Generated ${parsed.length} questions from chunk ${chunkNum}`);
  
  return parsed;
}

/**
 * Merge and deduplicate questions from multiple chunks
 */
function mergeAndDeduplicateQuestions(allQuestions) {
  // Simple deduplication based on question text similarity
  const uniqueQuestions = [];
  const seenQuestions = new Set();
  
  for (const q of allQuestions) {
    // Normalize question for comparison
    const normalizedQ = q.question?.toLowerCase().trim();
    if (normalizedQ && !seenQuestions.has(normalizedQ)) {
      seenQuestions.add(normalizedQ);
      uniqueQuestions.push(q);
    }
  }
  
  return uniqueQuestions;
}

/**
 * Fallback response when AI fails
 */
function getFallbackResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('quiz') || lower.includes('test')) {
    return {
      success: true,
      tool: 'quiz',
      message: 'I apologize, but I encountered an issue generating your quiz. Please try again.',
      data: { error: 'AI service unavailable' }
    };
  }
  
  if (lower.includes('learn') || lower.includes('explain') || lower.includes('tutorial')) {
    return {
      success: true,
      tool: 'content',
      message: 'I apologize, but I encountered an issue generating learning content. Please try again.',
      data: { error: 'AI service unavailable' }
    };
  }
  
  if (lower.includes('pdf') || lower.includes('document')) {
    return {
      success: true,
      tool: 'rag',
      message: 'I apologize, but I encountered an issue processing your document. Please try again.',
      data: { error: 'AI service unavailable' }
    };
  }
  
  return {
    success: true,
    tool: 'content',
    message: 'I apologize, but I encountered an issue processing your request. Please try again.',
    data: { error: 'AI service unavailable' }
  };
}

/**
 * Get fallback response specifically for PDF quiz generation
 */
function getPdfQuizFallbackResponse(pdfText = '', topic = 'Document Quiz') {
  const fallbackQuestions = generateHeuristicQuestionsFromText(pdfText, topic);
  return {
    success: true,
    tool: 'quiz',
    message: `Generated a fallback quiz with ${fallbackQuestions.length} questions while AI service is temporarily unavailable.`,
    data: {
      questions: fallbackQuestions,
      topic,
      source: 'pdf',
      fallback: true
    }
  };
}

/**
 * Build a minimal fallback quiz from plain text when AI APIs are unavailable.
 * Keeps UI flow working by returning valid MCQ objects.
 */
function generateHeuristicQuestionsFromText(text = '', topic = 'Document Quiz') {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 5);

  const stop = new Set([
    'about','above','after','again','against','being','below','between','could','document','during',
    'first','found','great','their','there','these','those','through','under','where','which','while',
    'would','content','using','based','other','should','because','learning','question','questions'
  ]);

  const freq = new Map();
  words.forEach(w => {
    if (!stop.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  });

  const topKeywords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);

  const base = topKeywords.length ? topKeywords : ['concept', 'implementation', 'architecture', 'performance', 'testing', 'security'];

  return base.slice(0, 6).map((kw, idx) => {
    const cap = kw.charAt(0).toUpperCase() + kw.slice(1);
    const options = [
      `${cap} in practical use`,
      `${cap} as a theoretical model`,
      `${cap} with no trade-offs`,
      `${cap} unrelated to the topic`
    ];

    return {
      originalIndex: idx,
      question: `In ${topic}, which statement best reflects ${cap} based on the document context?`,
      options,
      correctAnswer: options[0],
      explanation: `${cap} is presented in the document as an applied concept tied to real usage decisions.`,
      category: 'Document Understanding'
    };
  });
}

/**
 * Get available tools for function calling
 */
function getTools() {
  return [
    quizToolSchema,
    ragToolSchema,
    analyticsToolSchema,
    contentToolSchema,
    personalizedContentToolSchema,
    quizFromTextToolSchema,
    evaluateLearningStyleToolSchema,
    evaluateAnswerToolSchema,
    validateContentToolSchema
  ];
}

/**
 * Main entry point - route the message to appropriate tool
 * @param {Object} params
 * @param {string} params.message - User's message
 * @param {string} params.userId - User ID
 * @param {string} params.sessionId - Session ID for RAG
 * @param {string} params.model - AI model to use (deprecated, always uses Gemini)
 * @param {Object} params.context - Additional context (profile, quiz answers, quizType, etc.)
 * @returns {Promise<Object>} Agent response
 */
export async function routeMessage({ message, userId, sessionId, model = 'gemini', context = {} }) {
  console.log("LearningAgent received message:", message);
  console.log("Context received:", JSON.stringify(context));
  
  try {
    // ============================================================
    // SPECIAL HANDLING: Topic-based quiz generation (uses Gemini via quizTool)
    // ============================================================
    if (context?.quizType === "topic" && context?.topic) {
      console.log("📝 Topic-based quiz request - using Gemini via quizTool");
      
      try {
        const result = await quizTool({
          topic: context.topic,
          difficulty: context.difficulty || 'medium',
          questionCount: context.questionCount || 10,
          userId
        });
        
        if (result.success) {
          return {
            success: true,
            tool: 'quiz',
            originalMessage: message,
            response: result.message,
            rawData: result.data
          };
        }
      } catch (geminiError) {
        console.error("❌ Gemini topic quiz error, retrying:", geminiError.message);
        try {
          const retryResult = await quizTool({
            topic: context.topic,
            difficulty: context.difficulty || 'medium',
            questionCount: context.questionCount || 10,
            userId
          });
          if (retryResult.success) {
            return {
              success: true,
              tool: 'quiz',
              originalMessage: message,
              response: retryResult.message,
              rawData: retryResult.data
            };
          }
        } catch (retryError) {
          console.error("❌ Retry failed:", retryError.message);
        }
      }
    }

    // ============================================================
    // SPECIAL HANDLING: PDF text quiz generation (uses Gemini with chunking)
    // ============================================================
    if (context?.pdfText && context.pdfText.length > 1000) {
      console.log("📄 PDF text quiz request - using Gemini with chunking");
      
      try {
        const result = await generateQuizFromPdfWithGemini({
          pdfText: context.pdfText,
          topic: context.topic || 'Document Quiz'
        });
        
        if (result.success) {
          return {
            success: true,
            tool: 'quiz',
            originalMessage: message,
            response: result.message,
            rawData: result.data
          };
        }
      } catch (geminiError) {
        console.error("❌ Gemini PDF quiz error, retrying:", geminiError.message);
        try {
          const retryResult = await generateQuizFromPdfWithGemini({
            pdfText: context.pdfText,
            topic: context.topic || 'Document Quiz'
          });
          if (retryResult.success) {
            return {
              success: true,
              tool: 'quiz',
              originalMessage: message,
              response: retryResult.message,
              rawData: retryResult.data
            };
          }
        } catch (retryError) {
          console.error("❌ Retry failed:", retryError.message);
          return getPdfQuizFallbackResponse(context.pdfText, context.topic || 'Document Quiz');
        }
      }
    }
    
    // ============================================================
    // SPECIAL HANDLING: Quiz generation from PDF/Document
    // Use Gemini API for intent selection and generation
    // ============================================================
    const isPdfQuizRequest = isQuizFromDocument(message);
    let topic = context?.topic || 'Document Quiz';
    
    if (isPdfQuizRequest) {
      console.log("📄 PDF Quiz request detected - using Gemini exclusively");
      topic = context?.topic || 'Document Quiz';
      
      // Check if Gemini is available
      if (!genAI) {
        console.log("⚠️ Gemini not available, using fallback");
        return getPdfQuizFallbackResponse(context?.pdfText || '', topic);
      }
      
      // Check if PDF text is available in context
      const pdfText = context?.pdfText || '';
      
      if (!pdfText || pdfText.length < 200) {
        return {
          success: true,
          tool: 'quiz',
          originalMessage: message,
          response: 'To generate a quiz from a PDF, please upload a document first or provide the document content.',
          rawData: { needsPdf: true }
        };
      }
      
      try {
        // Use Gemini with chunking for PDF quiz generation
        const result = await generateQuizFromPdfWithGemini({
          pdfText,
          topic
        });
        
        if (result.success) {
          return {
            success: true,
            tool: 'quiz',
            originalMessage: message,
            response: result.message,
            rawData: result.data
          };
        } else {
          // Gemini generation failed, return fallback
          console.log("⚠️ Gemini PDF quiz generation failed, using fallback");
          return getPdfQuizFallbackResponse(pdfText, topic);
        }
      } catch (geminiError) {
        console.error("❌ Gemini PDF quiz error:", geminiError.message);
        return getPdfQuizFallbackResponse(pdfText, topic);
      }
    }
    
    // ============================================================
    // END SPECIAL HANDLING FOR PDF QUIZ
    // ============================================================
    
    // If it's a direct PDF chat request, use RAG tool directly and skip model rerouting
    const isPdfChatRequest = isPdfChat(message);
    if (isPdfChatRequest) {
      console.log("📄 Direct PDF chat request detected, using ragTool directly");
      const ragResult = await ragTool({ message, sessionId, userId });
      return {
        success: ragResult.success,
        tool: 'rag',
        originalMessage: message,
        response: formatResponse('rag', ragResult),
        rawData: ragResult.data || null
      };
    }

    // Check PDF status first for RAG context
    const pdfStatus = await checkPdfStatus();
    console.log("PDF status:", pdfStatus);

    // Build user profile context
    const profileContext = context?.userProfile ? `
User Profile:
- Technical Level: ${context.userProfile.technicalLevel || 'unknown'}
- Learning Style: ${context.userProfile.learningStyle || 'unknown'}
- Technical Score: ${context.userProfile.technicalScore || 'N/A'}
- Learning Score: ${context.userProfile.learningScore || 'N/A'}
` : '';
    
    // Build quiz context if available
    const quizContext = context?.quizAnswers ? `
Current Quiz:
- Questions answered: ${context.quizAnswers.length}
- Current score: ${context.quizAnswers.filter(a => a.correct).length}/${context.quizAnswers.length}
` : '';
    
    // Build PDF context if available
    const pdfContext = context?.pdfText ? `
PDF Context (${(context.pdfText.length / 1000).toFixed(1)}KB):
${context.pdfText.substring(0, 1000)}...
` : '';
    
    // Build context about available tools
    const toolContext = `
Available tools:
1. quizTool - Generate quizzes on any topic. Available: YES
2. ragTool - Chat with uploaded PDFs. Available: ${pdfStatus.success ? (pdfStatus.pdfLoaded ? 'YES (PDF loaded)' : 'NO (no PDF uploaded)') : 'NO (service unavailable)'}
3. analyticsTool - View learning progress and analytics. Available: YES
4. contentTool - Generate educational learning material, tutorials, explanations on any topic. Available: YES
5. personalizedContentTool - Generate personalized content based on user's technical level and learning style. Available: YES
6. quizFromTextTool - Generate quiz questions from extracted document/PDF text. Available: YES
7. evaluateLearningStyleTool - Evaluate user's learning style from assessment answers. Available: YES
8. evaluateAnswerTool - Evaluate quality and accuracy of a student's answer. Available: YES
9. validateContentTool - Validate quality of generated educational content. Available: YES

User context:
- User ID: ${userId || 'anonymous'}
- Session ID: ${sessionId || 'new'}
${profileContext}${quizContext}${pdfContext}

Choose the MOST appropriate tool based on the user's message. 
- If user wants a quiz, test, or practice → use quizTool
- If user asks about their progress, scores, performance, history → use analyticsTool  
- If user asks about a document, PDF, or wants to discuss uploaded content → use ragTool (if available)
- If user wants to learn about a topic, get explanations, tutorials → use contentTool
- If user wants personalized content based on their level/style → use personalizedContentTool
- If user has document text and wants quiz → use quizFromTextTool
- If user submits answers for evaluation → use evaluateAnswerTool
- If unclear, default to contentTool for learning requests

User message: "${message}"
`;

    console.log("Agent deciding tool...");
    
    // ============================================================
    // API ROUTING RULES:
    // - Direct PDF chat handled above via ragTool
    // - Always use Gemini
    // ============================================================
    // Force Gemini for all requests
    let effectiveModel = 'gemini';
    
    console.log(`API Routing: isPdfChat=${isPdfChatRequest}, using=${effectiveModel}`);
    
    let toolCall = null;

    // Use Gemini for all requests
    if (effectiveModel === 'gemini' && genAI) {
      console.log("Using Gemini for tool selection");
      toolCall = await routeWithGemini(toolContext, message);
    }
    // Fallback to simple keyword matching
    else {
      console.log("Using keyword matching for tool selection (no AI API key)");
      toolCall = routeWithKeywords(message);
    }

    console.log("Selected tool:", toolCall.tool, "with params:", toolCall.params);

    // Execute the selected tool
    console.log(`Executing tool: ${toolCall.tool}`);

    let result;
    switch (toolCall.tool) {
      case 'quiz':
        result = await quizTool({
          ...toolCall.params,
          userId,
          docText: context?.pdfText || null
        });
        break;
      case 'rag':
        result = await ragTool({
          ...toolCall.params,
          sessionId,
          userId
        });
        break;
      case 'analytics':
        result = await analyticsTool({
          ...toolCall.params,
          userId
        });
        break;
      case 'content':
        result = await contentTool({
          ...toolCall.params,
          userId
        });
        break;
      case 'personalizedContent':
        result = await personalizedContentTool({
          ...toolCall.params,
          userId
        });
        break;
      case 'quizFromText':
        result = await quizFromTextTool({
          ...toolCall.params
        });
        break;
      case 'evaluateLearningStyle':
        result = await evaluateLearningStyleTool({
          ...toolCall.params
        });
        break;
      case 'evaluateAnswer':
        result = await evaluateAnswerTool({
          ...toolCall.params
        });
        break;
      case 'validateContent':
        result = await validateContentTool({
          ...toolCall.params
        });
        break;
      default:
        result = {
          success: false,
          message: 'Unable to determine which tool to use. Please try again.'
        };
    }

    console.log("Tool execution result:", result.success ? "Success" : "Failed");

    // Format final response
    const response = {
      success: result.success,
      tool: toolCall.tool,
      originalMessage: message,
      response: formatResponse(toolCall.tool, result),
      rawData: result.data || null
    };

    console.log("Agent response ready");
    return response;

  } catch (error) {
    console.error('❌ LearningAgent error:', error);
    return {
      success: false,
      error: error.message,
      message: 'An error occurred while processing your request. Please try again.'
    };
  }
}

/**
 * Route using Gemini function calling
 */
async function routeWithGemini(systemContext, userMessage) {
  console.log("routeWithGemini called");
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    tools: [
      {
        functionDeclarations: [
          quizToolSchema, 
          ragToolSchema, 
          analyticsToolSchema,
          contentToolSchema,
          personalizedContentToolSchema,
          quizFromTextToolSchema,
          evaluateLearningStyleToolSchema,
          evaluateAnswerToolSchema,
          validateContentToolSchema
        ]
      }
    ]
  });

  const prompt = `${systemContext}\n\nUser message: "${userMessage}"`;
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  
  const functionCall = response.functionCalls()?.[0];
  
  if (!functionCall) {
    return routeWithKeywords(userMessage);
  }

  return {
    tool: functionCall.name.replace('Tool', ''),
    params: functionCall.args || {}
  };
}

/**
 * Simple NLP-based tool selection using keyword scoring
 * Provides more accurate routing than simple keyword matching
 */
function routeWithIntent(message, context = {}) {
  console.log("routeWithIntent called with:", message);
  
  const lowerMessage = message.toLowerCase();
  
  // Intent patterns with weights
  const intents = [
    {
      tool: 'quiz',
      patterns: [
        { pattern: /quiz|test|exam|assessment/i, weight: 3 },
        { pattern: /practice|question/i, weight: 2 },
        { pattern: /generate.*quiz|create.*quiz/i, weight: 3 },
        { pattern: /take.*quiz|i want.*quiz/i, weight: 3 }
      ],
      extractTopic: (msg) => {
        const cleaned = msg.replace(/quiz|test|question|practice|exam|assess|generate|create|take a/i, '').trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'General Knowledge';
      }
    },
    {
      tool: 'rag',
      patterns: [
        { pattern: /pdf|document|file/i, weight: 3 },
        { pattern: /this.*page|this.*chapter/i, weight: 2 },
        { pattern: /explain.*content|what.*about/i, weight: 1 }
      ],
      extractTopic: (msg) => ({ message: msg })
    },
    {
      tool: 'content',
      patterns: [
        { pattern: /explain|tutorial|learn|teach/i, weight: 3 },
        { pattern: /what.*is|how.*work/i, weight: 2 },
        { pattern: /study|lesson|material/i, weight: 2 },
        { pattern: /understand|concept/i, weight: 2 }
      ],
      extractTopic: (msg) => {
        const cleaned = msg.replace(/explain|learn|teach me|tutorial|study|material|lesson|concept|understand/i, '').trim();
        return { topic: cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'General Knowledge', 
                 technicalLevel: context.userProfile?.technicalLevel || 'intermediate',
                 learningStyle: context.userProfile?.learningStyle || 'reading' };
      }
    },
    {
      tool: 'analytics',
      patterns: [
        { pattern: /progress|performance|analytics/i, weight: 3 },
        { pattern: /score|history|statistics/i, weight: 2 },
        { pattern: /my.*result|my.*performance/i, weight: 3 },
        { pattern: /weakness|strength|analysis/i, weight: 2 }
      ],
      extractTopic: () => ({})
    },
    {
      tool: 'personalizedContent',
      patterns: [
        { pattern: /personalized|custom/i, weight: 3 },
        { pattern: /based on.*level/i, weight: 3 },
        { pattern: /my.*learning.*style/i, weight: 3 }
      ],
      extractTopic: (msg) => {
        const topic = msg.replace(/personalized|custom|based on my|learning style/i, '').trim();
        return { 
          topic: topic.charAt(0).toUpperCase() + topic.slice(1) || 'General',
          technicalLevel: context.userProfile?.technicalLevel || 'intermediate',
          learningStyle: context.userProfile?.learningStyle || 'reading',
          technicalScore: context.userProfile?.technicalScore || 50,
          learningScore: context.userProfile?.learningScore || 50
        };
      }
    },
    {
      tool: 'evaluateAnswer',
      patterns: [
        { pattern: /check.*answer|evaluate.*answer/i, weight: 3 },
        { pattern: /is.*correct|am.*right/i, weight: 2 },
        { pattern: /review.*my/i, weight: 2 }
      ],
      extractTopic: () => ({ question: message, answer: '' })
    },
    {
      tool: 'quizFromText',
      patterns: [
        { pattern: /quiz.*from.*text|quiz.*from.*document/i, weight: 3 },
        { pattern: /generate.*from.*content/i, weight: 2 }
      ],
      extractTopic: () => ({ docText: context?.pdfText || '' })
    }
  ];
  
  // Score each intent
  let bestIntent = null;
  let bestScore = 0;
  
  for (const intent of intents) {
    let score = 0;
    for (const { pattern, weight } of intent.patterns) {
      if (pattern.test(lowerMessage)) {
        score += weight;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }
  
  // If we have a match with sufficient confidence
  if (bestIntent && bestScore >= 2) {
    console.log("🔍 Intent matched:", bestIntent.tool, "with score:", bestScore);
    return {
      tool: bestIntent.tool,
      params: bestIntent.extractTopic(message, context)
    };
  }
  
  // Default routing based on message type
  console.log("🔍 No strong intent match, using default routing");
  
  // If message is a question about content, use RAG
  if (lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
    // Check if PDF is available
    if (context?.pdfText || lowerMessage.includes('pdf') || lowerMessage.includes('document')) {
      return { tool: 'rag', params: { message } };
    }
    return { tool: 'content', params: { topic: 'General Knowledge', technicalLevel: 'intermediate', learningStyle: 'reading' } };
  }
  
  // Default to content generation
  return { 
    tool: 'content', 
    params: { 
      topic: 'General Knowledge', 
      technicalLevel: context.userProfile?.technicalLevel || 'intermediate',
      learningStyle: context.userProfile?.learningStyle || 'reading'
    } 
  };
}

/**
 * Fallback keyword-based routing (kept for compatibility)
 */
function routeWithKeywords(message) {
  console.log("routeWithKeywords called with:", message);
  
  const lowerMessage = message.toLowerCase();
  
  // Quiz keywords
  const quizKeywords = ['quiz', 'test', 'question', 'practice', 'exam', 'assess', 'generate', 'create quiz', 'take a quiz'];
  if (quizKeywords.some(kw => lowerMessage.includes(kw))) {
    let topic = lowerMessage
      .replace(/quiz|test|question|practice|exam|assess|generate|create|take a/i, '')
      .trim() || 'General Knowledge';
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    return {
      tool: 'quiz',
      params: { topic }
    };
  }
  
  // Content/Learning material keywords
  const contentKeywords = ['explain', 'learn', 'teach me', 'tutorial', 'study', 'material', 'lesson', 'concept', 'understand'];
  if (contentKeywords.some(kw => lowerMessage.includes(kw))) {
    let topic = lowerMessage
      .replace(/explain|learn|teach me|tutorial|study|material|lesson|concept|understand/i, '')
      .trim() || 'General Knowledge';
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    
    // Check if personalized content is requested
    if (lowerMessage.includes('personalized') || lowerMessage.includes('learning path')) {
      return {
        tool: 'personalizedContent',
        params: { topic, technicalLevel: 'intermediate', learningStyle: 'balanced' }
      };
    }
    
    return {
      tool: 'content',
      params: { topic, technicalLevel: 'intermediate', learningStyle: 'reading' }
    };
  }
  
  // Analytics keywords
  const analyticsKeywords = ['progress', 'score', 'performance', 'analytics', 'history', 'statistics', 'how am i', 'my performance', 'my progress', 'learning', 'weaknesses', 'strengths', 'analysis'];
  if (analyticsKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      tool: 'analytics',
      params: {}
    };
  }
  
  // RAG/PDF keywords
  const ragKeywords = ['pdf', 'document', 'file', 'what is', 'how does', 'tell me about', 'read', 'chapter', 'page'];
  if (ragKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      tool: 'rag',
      params: { message }
    };
  }
  
  // Validation keywords
  const validationKeywords = ['validate', 'check my answer', 'evaluate', 'review my'];
  if (validationKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      tool: 'evaluateAnswer',
      params: { question: message, answer: '' }
    };
  }
  
  // Default to RAG if message is a question
  if (lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
    return {
      tool: 'rag',
      params: { message }
    };
  }
  
  // Default fallback - use content tool for general learning
  return {
    tool: 'content',
    params: { topic: 'General Knowledge', technicalLevel: 'intermediate', learningStyle: 'reading' }
  };
}

/**
 * Format the response based on tool and result
 */
function formatResponse(tool, result) {
  if (!result.success) {
    return result.message || 'Something went wrong. Please try again.';
  }

  switch (tool) {
    case 'quiz':
      return result.message || 'Quiz generated successfully!';
    case 'rag':
      return result.data?.answer || result.data?.response || result.message || 'Got response from PDF';
    case 'analytics':
      const summary = result.data?.summary;
      if (summary) {
        return `Here's your learning summary:\n- Total Analyses: ${summary.totalAnalyses}\n- Quizzes Taken: ${summary.totalQuizzes}\n- Average Score: ${summary.averageScore}%\n\nWould you like more details?`;
      }
      return result.message || 'Retrieved your analytics';
    case 'content':
    case 'personalizedContent':
      if (result.data?.sections) {
        return `Here's your learning material on ${result.data.topic || 'the topic'}:\n\n${result.data.sections?.slice(0, 3).map(s => `**${s.title}**\n${s.content?.substring(0, 200)}`).join('\n\n')}`;
      }
      return result.message || 'Generated learning material successfully!';
    case 'quizFromText':
      return result.message || 'Generated quiz from your document!';
    case 'evaluateLearningStyle':
      return result.message || 'Learning style evaluation complete!';
    case 'evaluateAnswer':
      if (result.data?.feedback) {
        return `Answer Evaluation:\nScore: ${result.data.score}/100\nFeedback: ${result.data.feedback}`;
      }
      return result.message || 'Answer evaluated!';
    case 'validateContent':
      if (result.data?.quality) {
        return `Content Validation:\nQuality Score: ${result.data.quality}/100\nValid: ${result.data.isValid ? 'Yes' : 'No'}`;
      }
      return result.message || 'Content validated!';
    default:
      return result.message || 'Request processed successfully';
  }
}

export default { routeMessage };
