/**
 * AI Service
 * Handles all AI (Groq/LLaMA) operations
 */

import { groq, getModel, generateCompletion } from "../config/ai.js";
import { parseJson } from "../utils/jsonParser.js";
import { logError } from "../utils/logger.js";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

/**
 * Generate quiz questions from text or topic
 * @param {string} text - Document text or topic
 * @param {Object} options - Quiz generation options
 * @returns {Array} - Array of quiz questions
 */
async function generateQuizQuestions(text, options = {}) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const prompt = buildQuizPrompt(text, options);

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output');
    }
    return parseJson(rawText);
  } catch (error) {
    // Try fallback model
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Build prompt for quiz generation
 * @param {string} text - Document text or topic
 * @param {Object} options - Quiz options
 * @returns {string} - Formatted prompt
 */
function buildQuizPrompt(text, options = {}) {
  const { topic, difficulty = 'intermediate', technicalLevel } = options;
  
  // Check if text is a topic or actual content
  const isTopic = text.trim().length < 200;
  
  if (isTopic) {
    return `Generate comprehensive skill-testing quiz questions on topic: ${text}. 

Target difficulty level: ${technicalLevel || difficulty}.

The questions should test practical understanding and application of concepts related to ${text}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${technicalLevel || difficulty} level learner should know about ${text}.

Return ONLY valid JSON as an array of questions.`;
  }
  
  // Text is actual content - generate from it
  return `Convert this content into skill-testing multiple choice questions:

${text}

Generate 10 questions that test understanding and application, not just recall.

Return ONLY valid JSON as an array of questions.`;
}

/**
 * Generate learning material for a topic
 * @param {string} topic - Learning topic
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Object} - Generated learning material
 */
async function generateLearningMaterial(topic, technicalLevel, learningStyle) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const level = (technicalLevel || 'intermediate').toLowerCase();
  const style = (learningStyle || 'reading').toLowerCase();

  const personalization = level === 'beginner' 
    ? 'Use simple language, everyday analogies, and step-by-step explanations. Avoid jargon unless defined.'
    : level === 'advanced'
    ? 'Use technical terminology, cover deep concepts, include edge cases and optimizations.'
    : 'Balance clarity with practical examples, assume basic understanding.';

  const styleGuidance = style === 'visual'
    ? 'Describe concepts with visual descriptions, mention diagrams, and spatial relationships.'
    : style === 'auditory'
    ? 'Use conversational tone, mention discussions and verbal explanations.'
    : style === 'kinesthetic'
    ? 'Include hands-on activities, real-world projects, and practical exercises.'
    : 'Use structured text with clear headings, bullet points, and detailed explanations.';

  const prompt = `You are an expert web development instructor.

Generate COMPLETE and DETAILED course content on: ${topic}

User Profile:
- Technical Level: ${level}
- Learning Style: ${style}

STRICT RULES:

1. Each lesson must be UNIQUE (no repetition)
   - No duplicate content between sections
   - Each section covers different aspect of ${topic}

2. Each lesson must include:
   - Explanation (minimum 6-8 lines)
   - Real-world example
   - Code example (as string)

3. Applications:
   - At least 5
   - Each must include explanation (2-3 lines)

4. Examples:
   - Must be STRING (not object)
   - Include proper code snippet

5. Mini Project:
   - MUST include:
     - title
     - 5 steps

6. Content must be:
   - Practical
   - Detailed
   - Beginner-friendly
   - Specific to ${topic} only

7. NEVER return:
   - [object Object]
   - repeated content
   - empty sections
   - cross-topic content (e.g., no JavaScript in CSS topic)

CONTENT STRUCTURE:

1. OVERVIEW:
- Explain topic in simple real-world way (5-6 lines)

2. CORE CONCEPTS:
- Minimum 6-8 key points
- Each point must have unique explanation (not just 1 line)

3. DETAILED SECTIONS:
Generate 5 unique sections covering different aspects.
For EACH section:
- Explanation (minimum 6-8 lines) - unique content
- Real-world example - specific to this section
- Code example (proper formatted as string)
- Why it matters

4. APPLICATIONS:
Generate 5 unique REAL applications.
Each must be 2-3 lines explanation.

5. EXAMPLES:
Provide 3-5 practical examples.
Each must include:
  - Title (unique)
  - Code snippet (as string)
  - Explanation (unique)

6. COMMON MISTAKES:
- 5 unique real developer mistakes

7. BEST PRACTICES:
- 5 unique industry-level practices

8. MINI PROJECT:
- Give 1 project idea using ${topic}
- Include exactly 5 steps

9. INTERVIEW QUESTIONS:
- 5 questions with answers
- ONLY from ${topic}

${personalization}
${styleGuidance}

OUTPUT FORMAT (STRICT JSON):

{
  "title": "string",
  "overview": "string",
  "keyConcepts": [
    {
      "point": "string",
      "explanation": "string"
    }
  ],
  "sections": [
    {
      "heading": "string",
      "explanation": "string",
      "realWorldExample": "string",
      "codeExample": "string",
      "importance": "string"
    }
  ],
  "applications": [
    {
      "title": "string",
      "description": "string"
    }
  ],
  "examples": [
    {
      "title": "string",
      "code": "string",
      "explanation": "string"
    }
  ],
  "commonMistakes": ["string"],
  "bestPractices": ["string"],
  "miniProject": {
    "title": "string",
    "steps": ["string", "string", "string", "string", "string"]
  },
  "interviewQuestions": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}

Return ONLY valid JSON, no explanations or markdown outside the JSON.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for learning material');
    }
    
    let parsed = parseJson(rawText);
    if (parsed && typeof parsed === 'object') {
      parsed = sanitizeContentObject(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for learning material');
    }
    
    let parsed = parseJson(fallbackText);
    if (parsed && typeof parsed === 'object') {
      parsed = sanitizeContentObject(parsed);
    }
    
    return parsed;
  }
}

/**
 * Sanitize content object to ensure all fields are proper strings
 * @param {Object} obj - Content object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeContentObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return sanitizeContentObject(item);
          }
          return String(item ?? '');
        });
      } else {
        sanitized[key] = JSON.stringify(value);
      }
    } else if (typeof value === 'function') {
      sanitized[key] = '';
    } else {
      sanitized[key] = String(value);
    }
  }
  
  return sanitized;
}

/**
 * Generate quiz from learning material
 * @param {string} topic - Topic
 * @param {Object} material - Learning material
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Array} - Quiz questions
 */
async function generateQuizFromMaterial(topic, material, technicalLevel, learningStyle) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const materialSummary = material.sections
    ?.map(s => `${s.title}: ${s.content}`)
    .join('\n\n') || material.summary || '';

  const prompt = `Based on this learning material about ${topic}, generate 10 comprehensive multiple-choice questions that test SKILLS and APPLICATION of knowledge suitable for a ${technicalLevel || 'intermediate'} level learner:

Learning Material Content:
${materialSummary}

IMPORTANT: The questions should be tailored to ${technicalLevel || 'intermediate'} level knowledge.

GENERATE SKILL-BASED QUESTIONS, NOT EXTRACTIVE QUESTIONS:

❌ BAD (Extractive - just asks what was mentioned):
- "Which JavaScript library is mentioned in the document?"
- "What is the name of the project described?"

✅ GOOD (Skill-based - tests understanding and application):
- "When building a web application, which library would you choose for state management and why?"
- "Given a scenario where you need to handle async data fetching, which approach would be most appropriate?"

RULES:
1. Questions should test PROBLEM-SOLVING ability, not memory recall
2. Include practical SCENARIOS and USE CASES
3. Ask "what would you do if..." or "how would you..." type questions
4. Test understanding of WHEN to use different approaches
5. Include questions about TRADE-OFFS and DECISIONS

EXPLANATION RULES:
1. NEVER say "The correct answer is" or quote the answer text
2. ALWAYS explain the CONCEPT purely (what it is, how it works)
3. ALWAYS explain WHY the correct option works (the technical reasoning)
4. Keep to exactly 2 sentences

Return ONLY valid JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "[Explain the concept]. [Explain why this works]."
  }
]`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for quiz');
    }
    try {
      return parseJson(rawText);
    } catch {
      return rawText;
    }
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for quiz');
    }
    try {
      return parseJson(fallbackText);
    } catch {
      return fallbackText;
    }
  }
}

/**
 * Generate personalized content recommendations
 * @param {string} topic - Learning topic
 * @param {string} learningStyle - Learning style
 * @param {string} technicalLevel - Technical level
 * @returns {Object} - Personalized content
 */
async function generatePersonalizedContent(topic, learningStyle, technicalLevel) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate personalized content recommendations for learning ${topic}.

User profile:
- Learning Style: ${learningStyle || 'reading'}
- Technical Level: ${technicalLevel || 'intermediate'}

Create a JSON response with:

{
  "topic": "${topic}",
  "resources": [
    { "type": "Resource Type", "title": "Specific title", "description": "Why this is good for this learner", "duration": "time estimate" }
  ],
  "suggestedPath": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "tips": ["Tip 1 specific to this learning style", "Tip 2", "Tip 3"]
}

Requirements:
- Resources should be specific to ${learningStyle || 'reading'} learners
- Include a mix of resource types (articles, tutorials, exercises, projects)
- The suggested path should be actionable
- Tips should be practical
- Return ONLY valid JSON.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for content');
    }
    return parseJson(rawText);
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for content');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Generate combined learning content
 * @param {string} topic - Learning topic
 * @param {string} technicalLevel - Technical level
 * @param {number} technicalScore - Technical score
 * @param {string} learningStyle - Learning style
 * @param {number} learningScore - Learning score
 * @param {string} combinedAnalysis - Combined analysis text
 * @returns {Object} - Combined learning content
 */
async function generateCombinedContent(topic, technicalLevel, technicalScore, learningStyle, learningScore, combinedAnalysis) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate a highly personalized learning path for a user with the following profile:

- Topic: ${topic}
- Technical Level: ${technicalLevel || 'intermediate'}
- Technical Score: ${technicalScore || 50}%
- Learning Style: ${learningStyle || 'reading'}
- Learning Score: ${learningScore || 50}%

Create a JSON response with the following structure:

{
  "title": "Personalized ${topic} Learning Path",
  "overview": "A 2-3 sentence overview of what this learner will achieve",
  "learningPath": [
    "Step 1: [Specific action for this user profile]",
    "Step 2: [Specific action for this user profile]",
    "Step 3: [Specific action for this user profile]",
    "Step 4: [Specific action for this user profile]",
    "Step 5: [Specific action for this user profile]"
  ],
  "resources": [
    "Specific resource 1 tailored to ${learningStyle} learners at ${technicalLevel} level",
    "Specific resource 2 tailored to ${learningStyle} learners",
    "Specific resource 3"
  ],
  "tips": [
    "Tip 1 specific to ${learningStyle} learning style",
    "Tip 2 specific to ${learningStyle} learners",
    "Tip 3 for ${technicalLevel} level learners"
  ],
  "nextSteps": "Specific next action based on the user's scores (technical: ${technicalScore}%, learning: ${learningScore}%)",
  "combinedAnalysis": "Analysis of user: Technical ${technicalLevel} (${technicalScore}%), Learning style: ${learningStyle} (${learningScore}%)"
}

Requirements:
- Content must be genuinely personalized based on the user's scores and learning style
- ${learningStyle === 'visual' ? 'Include references to diagrams, videos, and visual content' : learningStyle === 'auditory' ? 'Include references to podcasts, videos, and audio content' : learningStyle === 'kinesthetic' ? 'Include hands-on exercises, projects, and practical activities' : 'Include reading materials, written tutorials, and text-based content'}
- ${technicalLevel === 'beginner' ? 'Use simple language, provide more guidance, break down into smaller steps' : technicalLevel === 'advanced' ? 'Use technical language, provide less guidance, focus on advanced concepts' : 'Balance between simple and technical language'}
- Return ONLY valid JSON, no additional text.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (!rawText) {
      throw new Error('Empty Groq output for combined content');
    }
    return parseJson(rawText);
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
    if (!fallbackText) {
      throw new Error('Empty Groq fallback output for combined content');
    }
    return parseJson(fallbackText);
  }
}

/**
 * Generate learning style assessment questions
 * @param {Object} userProfile - User profile
 * @param {string} topic - Topic
 * @returns {Array} - Assessment questions
 */
async function generateFromPdf(userProfile, topic) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  
  const prompt = `Generate 5 learning style assessment questions based on this user profile:

User Profile:
${JSON.stringify(userProfile)}

Topic: ${topic || 'General Technology'}

Create questions that assess the user's learning preferences. Return JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Best answer for this user profile"
  }
]

Requirements:
- Questions should assess learning preferences (visual, auditory, reading, kinesthetic)
- Include practical scenarios
- Return ONLY valid JSON.`;

  try {
    const rawText = await generateCompletion(prompt, { model: DEFAULT_MODEL });
    if (rawText) {
      return parseJson(rawText);
    }
  } catch (error) {
    console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
    try {
      const fallbackText = await generateCompletion(prompt, { model: FALLBACK_MODEL });
      if (fallbackText) {
        return parseJson(fallbackText);
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError.message);
    }
  }

  // Fallback to default questions
  return [
    { question: 'How do you prefer learning new tech?', options: ['Reading docs', 'Watching videos', 'Hands-on', 'Group discussion'], answer: 'Hands-on' },
    { question: 'Do you like step-by-step tutorials?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
    { question: 'Do you take notes while learning?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
    { question: 'Do you prefer online courses or offline?', options: ['Online', 'Offline', 'Hybrid', 'Doesn\'t matter'], answer: 'Online' },
    { question: 'Do you prefer small examples or full projects?', options: ['Small examples', 'Full projects', 'Both', 'Neither'], answer: 'Both' }
  ];
}

/**
 * Generate quiz questions from text or topic (wraps the pdf/questionGenerator)
 * @param {string} text - Document text or topic
 * @returns {Array} - Array of quiz questions
 */
async function generateQuestionsFromTopic(text) {
  // Check if text is a topic (short) or document content (long)
  if (text.length < 200) {
    // Use the built-in generateQuizQuestions for topic-based generation
    return generateQuizQuestions(text);
  }
  
  // For longer document content, use the external question generator
  // Dynamic import for the external question generator
  let questionGeneratorModule = null;
  async function getQuestionGenerator() {
    if (!questionGeneratorModule) {
      questionGeneratorModule = await import('../../pdf/questionGenerator.js');
    }
    return questionGeneratorModule;
  }
  
  const { generateQuestions: gen } = await getQuestionGenerator();
  return gen(text);
}

export {
  generateQuizQuestions,
  generateLearningMaterial,
  generateQuizFromMaterial,
  generatePersonalizedContent,
  generateCombinedContent,
  generateFromPdf,
  buildQuizPrompt,
  generateQuestionsFromTopic,
};
export default {
  generateQuizQuestions,
  generateLearningMaterial,
  generateQuizFromMaterial,
  generatePersonalizedContent,
  generateCombinedContent,
  generateFromPdf,
  buildQuizPrompt,
  generateQuestionsFromTopic,
};