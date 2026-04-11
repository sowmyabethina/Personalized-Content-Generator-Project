import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
import { ingestPdf } from "./rag/ingestPdf.js";

import { getEmbedding } from "./rag/embeddings.js";
import { logAgentEvent } from "./agentMonitor.js";
import { 
  similaritySearch, 
  similaritySearchWithThreshold, 
  initVectorStore,
  getChunkCount,
  clearVectorStore,
  getSequentialChunks,
  getAllChunkTexts,
  getChunksByPdfId
} from "./rag/vectorStore.js";

const app = express();
const PORT = process.env.PORT || 5001;
const INCLUDE_SOURCES = process.env.INCLUDE_SOURCES !== 'false';

// Initialize Groq - validate API key exists
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

if (!groq) {
  console.warn("WARNING: GROQ_API_KEY not set. Using fallback mode.");
}

const RAG_CORS_ORIGIN = process.env.CORS_ORIGIN || true; // Allow all by default
app.use(cors({
  origin: RAG_CORS_ORIGIN
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const chunkCount = await getChunkCount();
    const pdfInfo = currentPdfInfo;
    res.json({ 
      status: "ok",
      pdfLoaded: chunkCount > 0,
      chunkCount: chunkCount,
      fileName: pdfInfo?.fileName || null
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error",
      message: error.message 
    });
  }
});

// Mind Map Generation - Uses RAG retrieval to get relevant chunks, then Groq to generate hierarchical JSON mind map
app.post("/mindmap", async (req, res) => {
  console.log("🧠 Mind map generation API called");
   
  try {
    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      console.log("⚠️ No PDF uploaded");
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    console.log(`📚 Total chunks in DB: ${chunkCount}`);

    // Use RAG retrieval: semantic search for most relevant chunks
    const syntheticQuery = "Identify the main concepts, topics, and learning structure of this document";
    console.log(`🔍 Using synthetic query: "${syntheticQuery}"`);
    
    const queryEmbedding = await getEmbedding(syntheticQuery);
    
    // Get TOP 10 most semantically similar chunks (lower threshold to get more results)
    const results = await similaritySearchWithThreshold(queryEmbedding, 10, 0.2);
    
    console.log(`🔍 Retrieved ${results.length} chunks for mind map`);
    
    if (results.length === 0) {
      return res.status(400).json({ error: 'No relevant content found in PDF' });
    }

    // Log retrieved chunk scores and preview for debugging
    console.log("📋 Retrieved chunks with scores:");
    results.forEach((r, i) => {
      const score = r.score || r.similarity || 'N/A';
      const textPreview = (r.text || r.chunk_text || '').substring(0, 100).replace(/\n/g, ' ');
      console.log(`  [${i+1}] Score: ${score} | ${textPreview}...`);
    });

    // Preprocess chunks to extract relevant content
    let contextText = '';
    
    for (const result of results) {
      let text = result.text || result.chunk_text || '';
      
      // Preprocessing: remove unwanted content
      // Remove acknowledgements
      text = text.replace(/acknowledgement[s]?[:.]?[\s\S]*?(?=\n\n|\n|Chapter|Section|\d+\.)/gi, '');
      
      // Remove references/bibliography section
      text = text.replace(/references[:.]?[\s\S]*?(?=\n\n|\n)/gi, '');
      text = text.replace(/bibliography[:.]?[\s\S]*?(?=\n\n|\n)/gi, '');
      text = text.replace(/\[[\d,\s]+\]/g, ''); // Remove citation markers like [1], [2, 3]
      
      // Remove page numbers
      text = text.replace(/\bpage\s*\d+\b/gi, '');
      text = text.replace(/\b\d+\s*of\s*\d+\b/gi, '');
      
      // Remove copyright/footer/header text
      text = text.replace(/©\s*\d{4}.*/gi, '');
      text = text.replace(/copyright\s*\d{4}.*/gi, '');
      text = text.replace(/all\s*rights\s*reserved/gi, '');
      
      // Clean up extra whitespace
      text = text.replace(/\s+/g, ' ').trim();
      
      // Only include text that's at least 50 characters (meaningful content)
      if (text.length >= 50) {
        contextText += text + '\n\n';
      }
    }

    // Limit context to ~6000 chars to stay within token limits
    contextText = contextText.slice(0, 6000);
    console.log(`📄 Processed context length: ${contextText.length} characters`);

    // Strict prompt that enforces JSON output format
    const prompt = `Analyze the following technical text and generate a hierarchical mind map in JSON.

STRICT RULES:

1. IGNORE: Page numbers, citations (e.g., [1], Smith et al.), table of contents, headers/footers.
2. FOCUS: Only extract core concepts, definitions, and their logical relationships.
3. STRUCTURE: Maximum depth 3 levels.
4. TITLES: Each node title must be less than 5 words and meaningful (no fragments like "My deep respects for" or "of machine learning").

TEXT CONTENT:
${contextText}

RETURN ONLY VALID JSON (no explanations, no markdown):
{
"title": "Central Theme",
"children": [
{ "title": "Subtopic", "children": [] }
]
}`;

    console.log("🤖 Calling Groq for mind map generation...");
    
    // Check if Groq is configured
    if (!groq) {
      return res.status(503).json({ 
        error: 'Groq API key not configured. Please set GROQ_API_KEY in environment variables.'
      });
    }
    
    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are an expert mind map generator. Always return valid JSON only. Never return sentence fragments." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const rawResponse = completion.choices[0]?.message?.content;
    console.log("📨 Raw AI response received, length:", rawResponse?.length);
    console.log("📝 Raw AI response (first 500 chars):", rawResponse?.substring(0, 500));

    if (!rawResponse) {
      throw new Error("Empty response from AI");
    }

    // Validate JSON - NO FALLBACK to sentence splitting
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawResponse);
      console.log("✅ JSON parsed successfully");
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError.message);
      console.error("📝 Raw response was:", rawResponse.substring(0, 500));
      
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[0]);
          console.log("✅ JSON extracted from response");
        } catch (e2) {
          console.error("❌ JSON extraction also failed - returning error (no fallback)");
          return res.status(500).json({ 
            error: 'AI response is not valid JSON. Cannot render mind map.',
            details: parseError.message
          });
        }
      } else {
        console.error("❌ No JSON found in response - returning error (no fallback)");
        return res.status(500).json({ 
          error: 'AI response is not valid JSON. Cannot render mind map.',
          details: 'No JSON object found in response'
        });
      }
    }

    // Validate the structure - must have title and children
    if (!parsedJson.title || !parsedJson.children || !Array.isArray(parsedJson.children)) {
      console.error("❌ Invalid mind map structure:", parsedJson);
      return res.status(500).json({ 
        error: 'Invalid mind map structure from AI response',
        details: 'The AI response does not have the required title and children fields'
      });
    }

    console.log("✅ Generated Mind Map:", JSON.stringify(parsedJson).substring(0, 300) + "...");
    
    res.json(parsedJson);
  } catch (error) {
    console.error('❌ Mind map generation error:', error);
    // Don't return HTTP 500 - use fallback response instead
    console.log("Groq unavailable — using fallback mind map");
    
    // Generate a simple fallback mind map from the context
    const fallbackMindMap = {
      title: "Document Topics",
      children: [
        { 
          title: "Main Concept 1", 
          children: [{"title": "Subtopic A", children: []}, {"title": "Subtopic B", children: []}] 
        },
        { 
          title: "Main Concept 2", 
          children: [{"title": "Subtopic C", children: []}, {"title": "Subtopic D", children: []}] 
        },
        { 
          title: "Key Points", 
          children: [{"title": "Point 1", children: []}, {"title": "Point 2", children: []}] 
        }
      ]
    };
    
    res.json({
      ...fallbackMindMap,
      isFallback: true,
      message: "Operating in offline mode - showing basic structure"
    });
  }
});

/**
 * Extract topics from chunks for mind map
 */
function extractTopicsFromChunks(results) {
  // Get unique headings from chunks
  const headingMap = new Map();
  const allContent = [];
  
  for (const result of results) {
    const text = result.text || result.chunk_text;
    const heading = result.title || result.section_title;
    
    if (heading) {
      if (!headingMap.has(heading)) {
        headingMap.set(heading, []);
      }
    }
    allContent.push(text);
  }
  
  // Build mind map structure
  const fullText = allContent.join(' ');
  
  // Extract key phrases with improved filtering
  const phrases = extractKeyPhrasesImproved(fullText);
  
  // Determine root title from first chunk
  let rootTitle = "Document Overview";
  if (results.length > 0) {
    const firstText = results[0].text || results[0].chunk_text;
    const firstHeading = results[0].title || results[0].section_title;
    if (firstHeading) {
      rootTitle = firstHeading;
    } else if (firstText) {
      rootTitle = firstText.split(/\s+/).slice(0, 4).join(' ');
    }
  }
  
  // Group phrases into categories with better organization
  const categories = groupPhrasesImproved(phrases);
  
  return {
    title: rootTitle,
    children: categories
  };
}

/**
 * Improved key phrase extraction with better filtering
 */
function extractKeyPhrasesImproved(text) {
  const phraseMap = new Map();
  
  // Comprehensive stopwords including academic/common words
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on',
    'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'and', 'or', 'but', 'if', 'while', 'because',
    'it', 'its', 'this', 'that', 'these', 'those', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'we', 'you', 'he', 'she', 'me', 'him', 'her', 'us',
    'my', 'your', 'his', 'our', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'about', 'up', 'down', 'out', 'off', 'over', 'then',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'ever', 'never', 'always',
    'however', 'therefore', 'otherwise', 'thus', 'hence', 'even', 'still', 'yet',
    'get', 'got', 'make', 'made', 'take', 'took', 'see', 'saw', 'come', 'came', 'go', 'went',
    'say', 'said', 'know', 'knew', 'think', 'thought', 'want', 'use', 'find', 'give', 'tell',
    'try', 'call', 'keep', 'let', 'put', 'seem', 'provide', 'following', 'based', 'using',
    'done', 'given', 'shown', 'seen', 'called', 'included', 'containing', 'consists',
    'form', 'written', 'known', 'considered', 'able', 'certain', 'likely', 'possible',
    'required', 'needed', 'wanted', 'helps', 'allows', 'enables', 'works', 'well',
    // Academic/educational words to filter
    'learn', 'learning', 'study', 'studying', 'teach', 'teaching', 'understand',
    'understand', 'knowledge', 'explain', 'explain', 'example', 'chapter', 'section',
    'page', 'pages', 'figure', 'table', 'note', 'notes', 'reference', 'references',
    'according', 'paper', 'author', 'book', 'textbook', 'lecture', 'topic', 'topics',
    'subtopic', 'objective', 'objectives', 'goal', 'goals', 'aim', 'aims', 'purpose',
    'introduction', 'conclusion', 'summary', 'abstract', 'overview', 'review',
    'exercise', 'exercises', 'question', 'questions', 'answer', 'answers', 'solution',
    'solutions', 'problem', 'problems', 'concept', 'concepts', 'definition', 'definitions',
    'term', 'terms', 'meaning', 'importance', 'benefits', 'advantages', 'disadvantages',
    'types', 'kind', 'kinds', 'sort', 'sorts', 'various', 'different', 'similar',
    // Generic words
    'way', 'means', 'method', 'methods', 'process', 'processes', 'system', 'systems',
    'thing', 'things', 'stuff', 'case', 'cases', 'point', 'points', 'fact', 'facts',
    'part', 'parts', 'side', 'area', 'field', 'level', 'result', 'results', 'effect',
    'effects', 'issue', 'issues', 'reason', 'reasons', 'idea', 'ideas', 'word', 'words',
    'number', 'numbers', 'name', 'names', 'person', 'people', 'time', 'year', 'years',
    'day', 'days', 'new', 'first', 'last', 'next', 'previous', 'important', 'main',
    'general', 'common', 'particular', 'specific', 'various', 'available', 'used', 'using',
    // Common phrase patterns to filter
    'set', 'sets', 'collection', 'collections', 'allow', 'allows', 'allowing',
    'enable', 'enables', 'enabling', 'provide', 'provides', 'providing',
    'consist', 'consists', 'containing', 'contain', 'contains',
    'include', 'includes', 'including', 'included',
    'represent', 'represents', 'representing', 'represented',
    'describe', 'describes', 'describing', 'described',
    'explain', 'explains', 'explaining', 'explained',
    'define', 'defines', 'defining', 'defined',
    'identify', 'identifies', 'identifying', 'identified',
    'determine', 'determines', 'determining', 'determined',
    'understand', 'understands', 'understanding', 'understood',
    'obtain', 'obtains', 'obtaining', 'obtained',
    'offer', 'offers', 'offering', 'offered',
    'present', 'presents', 'presenting', 'presented',
    'discuss', 'discusses', 'discussing', 'discussed',
    'examine', 'examines', 'examining', 'examined',
    'analyze', 'analyzes', 'analyzing', 'analyzed',
    'address', 'addresses', 'addressing', 'addressed',
    'deal', 'deals', 'dealing', 'dealt',
    'cover', 'covers', 'covering', 'covered',
    'handle', 'handles', 'handling', 'handled',
    'involve', 'involves', 'involving', 'involved',
    'relate', 'relates', 'relating', 'related',
    'associate', 'associates', 'associating', 'associated',
    'need', 'needs', 'needing', 'needed',
    'use', 'uses', 'using', 'used',
    'make', 'makes', 'making', 'made',
    'give', 'gives', 'giving', 'gave',
    'get', 'gets', 'getting', 'got',
    'become', 'becomes', 'becoming', 'became',
    'appear', 'appears', 'appearing', 'appeared',
    'remain', 'remains', 'remaining', 'remained'
  ]);
  
  // Check if phrase is valid with improved logic
  function isValidImprovedPhrase(phrase) {
    const words = phrase.toLowerCase().split(/\s+/);
    
    // Must have at least 2 content words that are not in stopwords
    const contentWords = words.filter(w => !stopWords.has(w) && w.length > 3);
    if (contentWords.length < 2) return false;
    
    // Filter out phrases with numbers
    if (/\d/.test(phrase)) return false;
    
    // Filter out single character words
    if (words.some(w => w.length <= 1)) return false;
    
    // Filter out phrases that are mostly stopwords
    if (contentWords.length / words.length < 0.4) return false;
    
    // Filter out common generic phrase patterns
    const phraseLower = phrase.toLowerCase();
    const genericPatterns = [
      /^a\s+/, /^the\s+/, /^an\s+/, /^this\s+/, /^that\s+/,
      /\s+a$/, /\s+the$/, /\s+an$/, /\s+of$/, /\s+to$/, /\s+for$/,
      /^the\s+\w+\s+of$/, /^a\s+\w+\s+of$/,
      /^the\s+\w+\s+is$/, /^a\s+\w+\s+is$/,
      /\s+in\s+the$/, /\s+of\s+the$/, /\s+of\s+a$/,
      /^set\s+of/, /^collection\s+of/, /^group\s+of/, /^number\s+of/,
      /^way\s+to/, /^method\s+of/, /^process\s+of/, /^type\s+of/,
      /^kind\s+of/, /^sort\s+of/, /^type\s+of/
    ];
    
    for (const pattern of genericPatterns) {
      if (pattern.test(phraseLower)) return false;
    }
    
    return true;
  }
  
  // Extract bigrams (2-word phrases)
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + ' ' + words[i + 1];
    if (isValidImprovedPhrase(bigram)) {
      phraseMap.set(bigram, (phraseMap.get(bigram) || 0) + 1);
    }
  }
  
  // Extract trigrams (3-word phrases)
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
    if (isValidImprovedPhrase(trigram)) {
      phraseMap.set(trigram, (phraseMap.get(trigram) || 0) + 1);
    }
  }
  
  // Sort by frequency and take top phrases
  const allPhrases = Array.from(phraseMap.entries())
    .sort((a, b) => b[1] - a[1]);
  
  return allPhrases.slice(0, 30).map(([phrase]) => phrase);
}

/**
 * Improved phrase grouping with better organization
 */
function groupPhrasesImproved(phrases) {
  const categories = [];
  const used = new Set();
  
  // Remove phrases that are substrings of other phrases
  const filteredPhrases = phrases.filter(phrase => {
    for (const other of phrases) {
      if (phrase !== other && other.includes(phrase) && other.length > phrase.length) {
        return false;
      }
    }
    return true;
  });
  
  // Create categories from top phrases
  for (const phrase of filteredPhrases) {
    if (used.has(phrase)) continue;
    
    used.add(phrase);
    
    const category = {
      title: phrase,
      children: []
    };
    
    // Find related sub-phrases that share significant words
    for (const other of filteredPhrases) {
      if (used.has(other)) continue;
      
      // Check for common meaningful words
      const words1 = phrase.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const words2 = other.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const common = words1.filter(w => words2.includes(w));
      
      // Only group if they share at least one significant word
      if (common.length > 0) {
        category.children.push({ title: other, children: [] });
        used.add(other);
      }
    }
    
    // Only add category if it has children
    if (category.children.length > 0) {
      categories.push(category);
    } else {
      // Add as standalone category if it's an important phrase
      if (phrase.split(/\s+/).length >= 2 || phrase.length > 8) {
        categories.push(category);
      }
    }
  }
  
  // Add remaining phrases as individual categories (limit to top 8)
  let count = 0;
  for (const phrase of filteredPhrases) {
    if (!used.has(phrase) && count < 8) {
      categories.push({ title: phrase, children: [] });
      count++;
    }
  }
  
  return categories.slice(0, 8);
}

/**
 * Group phrases into categories
 */
function groupPhrasesSimple(phrases) {
  const categories = [];
  const used = new Set();
  
  // Create categories from top phrases
  for (const phrase of phrases) {
    if (used.has(phrase)) continue;
    
    used.add(phrase);
    
    const category = {
      title: phrase,
      children: []
    };
    
    // Find related sub-phrases
    for (const other of phrases) {
      if (used.has(other)) continue;
      
      // Check for common words
      const words1 = phrase.toLowerCase().split(/\s+/);
      const words2 = other.toLowerCase().split(/\s+/);
      const common = words1.filter(w => words2.includes(w));
      
      if (common.length > 0) {
        category.children.push({ title: other, children: [] });
        used.add(other);
      }
    }
    
    if (category.children.length > 0) {
      categories.push(category);
    }
  }
  
  // Add remaining phrases as individual categories
  for (const phrase of phrases) {
    if (!used.has(phrase)) {
      categories.push({ title: phrase, children: [] });
    }
  }
  
  return categories.slice(0, 8);
}

// Ensure uploads directory exists
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/", { recursive: true });
}

// Multer configuration with PDF file type validation
const upload = multer({ 
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  }
});

// Store uploaded PDF info
let currentPdfInfo = {
  fileName: null,
  pdfId: null,
  ingested: false
};

// Conversation memory store
const conversationStore = {};

// Rate limiting
let lastLlmCallTime = 0;
const LLM_CALL_INTERVAL = 3000;

const requestCache = new Map();
const CACHE_TTL = 20000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, 60000);

function getRequestCacheKey(question, chatId) {
  return `${chatId}:${question.toLowerCase().trim()}`;
}

// Clear old uploads on startup
const clearUploads = () => {
  try {
    const files = fs.readdirSync("uploads/");
    for (const file of files) {
      const filePath = fs.join("uploads/", file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    }
    console.log("🧹 Cleared old uploads folder");
  } catch (err) {
    // Ignore errors
  }
};

const TUTOR_PROMPT = `You are a helpful academic tutor.
Answer ONLY using the provided context.
If the answer is partially available, explain using the available text.
Do NOT say "information not found" unless context is completely empty.`;

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

async function generateAnswer(context, question, history = []) {
  const messages = [
    { role: "system", content: TUTOR_PROMPT },
    { role: "system", content: `Context from PDF document:\n${context.substring(0, 4000)}` },
    { role: "user", content: `Question: ${question}` }
  ];

  history.forEach(h => {
    messages.push({ role: "user", content: h.question });
    messages.push({ role: "assistant", content: h.answer });
  });

  // Check if Groq is configured
  if (!groq) {
    return {
      answer: generateFallbackAnswer(context, question),
      isFallback: true
    };
  }

  try {
    logAgentEvent("GROQ_CALL_STARTED");
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024
    });
    
    logAgentEvent("GROQ_SUCCESS");
    
    return {
      answer: completion.choices[0]?.message?.content || "No response generated.",
      isFallback: false
    };
  } catch (primaryError) {
    console.error('❌ Groq generateAnswer error:', primaryError.message);
    logAgentEvent("GROQ_FALLBACK_TRIGGERED", primaryError.message);
    
    // Try fallback model
    try {
      console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
      const fallbackCompletion = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1024
      });
      
      return {
        answer: fallbackCompletion.choices[0]?.message?.content || "No response generated.",
        isFallback: false
      };
    } catch (fallbackError) {
      console.error('❌ Fallback model also failed:', fallbackError.message);
      logAgentEvent("FALLBACK_TRIGGERED", fallbackError.message);
      return {
        answer: generateFallbackAnswer(context, question),
        isFallback: true
      };
    }
  }
}

/**
 * Fallback answer generator - provides rule-based responses when Groq fails
 * @param {string} context - Retrieved context from PDF
 * @param {string} question - User's question
 * @returns {string} Fallback answer
 */
function generateFallbackAnswer(context, question) {
  // Extract key sentences from context that might be relevant to the question
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const lowerQuestion = question.toLowerCase();
  
  // Find relevant sentences
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    // Check for keyword overlap
    const questionWords = lowerQuestion.split(/\s+/).filter(w => w.length > 3);
    return questionWords.some(word => lowerSentence.includes(word));
  });
  
  if (relevantSentences.length > 0) {
    // Return relevant content from the PDF
    const answer = relevantSentences.slice(0, 3).join('. ') + '.';
    return `Based on the document, here's what I found:\n\n${answer}\n\n*Note: I'm currently operating in offline mode with limited capabilities. The above is extracted from the PDF content.*`;
  }
  
  // Default fallback
  return `I found relevant content in the document but cannot process it with AI right now due to API limitations.\n\nFrom the document:\n${context.substring(0, 500)}...\n\n*Note: I'm currently operating in offline mode. Please try again later for full AI-powered answers.*`;
}

// Upload PDF endpoint
app.post("/upload-pdf", (req, res, next) => {
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    currentPdfInfo = {
      fileName: req.file.originalname,
      pdfId: null,
      ingested: false
    };

    console.log("📄 Processing PDF:", req.file.originalname);

    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF file is too small or empty" });
    }

    const result = await ingestPdf(filePath);
    
    currentPdfInfo.pdfId = result.pdfId;
    currentPdfInfo.ingested = true;
    
    fs.unlinkSync(filePath);

    console.log("✅ PDF uploaded and processed successfully");
    
    res.json({ 
      message: "PDF processed & stored in PostgreSQL database",
      fileName: req.file.originalname,
      pdfId: result.pdfId,
      chunkCount: result.chunkCount
    });
  } catch (error) {
    console.error("❌ Error uploading PDF:", error.message);
    res.status(500).json({ error: error.message || "Failed to process PDF" });
  }
});

// Ask question endpoint - uses existing vector search from database
app.post("/ask", async (req, res) => {
  try {
    const { question, similarityThreshold = 0.05 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    console.log("❓ Question:", question.substring(0, 50) + "...");

    const cacheKey = getRequestCacheKey(question, 'global');
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`⚡ Returning cached response for: "${question.substring(0, 30)}..."`);
      return res.json({
        ...cachedEntry.response,
        cached: true
      });
    }

    // Use database vector search (existing implementation)
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 3, similarityThreshold);

    if (!results.length) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF. Please try rephrasing your question."
      };
      if (INCLUDE_SOURCES) noAnswerResponse.sources = [];
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastLlmCallTime = now;

    // Build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, 3);
    
    console.log(`📚 Building context from ${topChunks.length} chunks`);
    
    const MAX_WORDS = 1500;
    let context = "";
    let wordCount = 0;
    for (const chunk of topChunks) {
      const chunkText = chunk.text || chunk.chunk_text;
      
      if (!chunkText) {
        console.warn('⚠️ Skipping chunk with no text:', chunk);
        continue;
      }
      
      const chunkWords = chunkText.split(/\s+/).length;
      if (wordCount + chunkWords <= MAX_WORDS) {
        context += (context ? "\n\n---\n\n" : "") + chunkText;
        wordCount += chunkWords;
      } else {
        break;
      }
    }

    // If context is empty, return error
    if (!context || context.trim() === '') {
      console.error('❌ No context could be built from chunks');
      return res.status(400).json({ 
        error: 'No retrievable content found in PDF chunks' 
      });
    }

    console.log(`📝 Context built: ${context.length} characters, ${wordCount} words`);

    const answer = await generateAnswer(context, question);

    const sources = topChunks.map((r) => ({
      text: (r.text || r.chunk_text).substring(0, 200) + "...",
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for question:", question.substring(0, 30) + "...");

    const responseData = { answer };
    if (INCLUDE_SOURCES) responseData.sources = sources;

    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error answering question:", error.message);
    // Don't return HTTP 500 - use fallback response instead
    console.log("Groq unavailable — using fallback answer");
    const fallbackAnswer = "I'm currently operating in offline mode. " +
      "I found relevant content in the document but cannot process it with AI right now. " +
      "Please try again later for full AI-powered answers.";
    res.json({ 
      answer: fallbackAnswer,
      isFallback: true,
      sources: []
    });
  }
});

// Chat endpoint - uses existing vector search from database
app.post("/chat", async (req, res) => {
  const startTime = Date.now();
  let mode = "unknown";
  let chatId = `chat_${Date.now()}`; // Default fallback
  
  try {
    const {
      question: rawQuestion,
      message: rawMessage,
      conversationHistory = [],
      sessionId,
      similarityThreshold = 0.05
    } = req.body;

    const question = (rawQuestion || rawMessage || '').trim();

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    
    // Log user message received
    logAgentEvent("USER_MESSAGE_RECEIVED", question.substring(0, 50) + "...");

    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    chatId = sessionId || chatId;

    if (!conversationStore[chatId]) {
      conversationStore[chatId] = {
        history: [],
        pdfContext: ""
      };
    }

    const cacheKey = getRequestCacheKey(question, chatId);
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`⚡ Returning cached response for: "${question.substring(0, 30)}..."`);
      return res.json({
        ...cachedEntry.response,
        cached: true,
        sessionId: chatId
      });
    }

    // Use database vector search (existing implementation)
    logAgentEvent("RAG_SEARCH_STARTED");
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 3, similarityThreshold);
    logAgentEvent("RAG_RESULTS_FOUND", results.length + " chunks");

    if (!results || results.length === 0) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF to answer your question. Please try rephrasing or asking about something specific in the document."
      };
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastLlmCallTime = Date.now();

    // Build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, 3);
    
    console.log(`📚 Building context from ${topChunks.length} chunks`);
    
    const MAX_WORDS = 1500;
    let context = "";
    let wordCount = 0;
    for (const chunk of topChunks) {
      const chunkText = chunk.text || chunk.chunk_text;
      
      if (!chunkText) {
        console.warn('⚠️ Skipping chunk with no text:', chunk);
        continue;
      }
      
      const chunkWords = chunkText.split(/\s+/).length;
      if (wordCount + chunkWords <= MAX_WORDS) {
        context += (context ? "\n\n---\n\n" : "") + chunkText;
        wordCount += chunkWords;
      } else {
        break;
      }
    }

    // If context is empty, return error
    if (!context || context.trim() === '') {
      console.error('❌ No context could be built from chunks');
      return res.status(400).json({ 
        error: 'No retrievable content found in PDF chunks' 
      });
    }

    console.log(`📝 Context built: ${context.length} characters, ${wordCount} words`);

    const answerResult = await generateAnswer(context, question, conversationHistory);
    const answer = answerResult.answer;
    const isFallback = answerResult.isFallback;
    
    // Set the mode based on whether fallback was used
    mode = isFallback ? "rule-based" : "groq";

    const sources = topChunks.map((r) => ({
      text: (r.text || r.chunk_text).substring(0, 200) + "...",
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for chat question:", question.substring(0, 30) + "...");

    const responseData = { answer, sessionId: chatId };
    if (INCLUDE_SOURCES) responseData.sources = sources;
    if (isFallback) responseData.isFallback = true;
    responseData.mode = mode;

    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    // Log response time and mode before sending
    const responseTime = Date.now() - startTime;
    logAgentEvent("RESPONSE_TIME", responseTime + "ms");
    logAgentEvent("RESPONSE_MODE", mode);
    
    res.json(responseData);
  } catch (error) {
    console.error("❌ Error in chat endpoint:", error.message);
    // Don't return HTTP 500 - use fallback response instead
    console.log("Groq unavailable — using fallback answer");
    logAgentEvent("FALLBACK_TRIGGERED", error.message);
    mode = "rule-based";
    
    const fallbackAnswer = "I'm currently operating in offline mode. " +
      "I found relevant content in the document but cannot process it with AI right now. " +
      "Please try again later for full AI-powered answers.";
    
    // Log response time and mode before sending
    const responseTime = Date.now() - startTime;
    logAgentEvent("RESPONSE_TIME", responseTime + "ms");
    logAgentEvent("RESPONSE_MODE", mode);
    
    res.json({ 
      answer: fallbackAnswer,
      isFallback: true,
      sessionId: chatId,
      sources: [],
      mode: mode
    });
  }
});

// Reset conversation endpoint
app.post("/reset", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId && conversationStore[sessionId]) {
      delete conversationStore[sessionId];
    }
    
    res.json({ message: "Conversation reset successfully" });
  } catch (error) {
    console.error("❌ Error resetting conversation:", error.message);
    res.status(500).json({ error: "Failed to reset conversation" });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await initVectorStore();
    console.log("Connected to PostgreSQL for vector storage");
    
    clearUploads();
    
    // Simple global error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong"
      });
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
 