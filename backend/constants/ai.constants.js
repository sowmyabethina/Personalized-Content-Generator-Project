/**
 * AI Model Configuration & Token Budget Constants
 * Centralized model names, token limits, and AI settings
 */

// ============================================
// MODEL NAMES & CONFIGURATION
// ============================================
export const AI_MODELS = {
  // Groq LLaMA Models
  GROQ_PRIMARY: process.env.GROQ_MODEL_PRIMARY || 'llama-3.3-70b-versatile',
  GROQ_FALLBACK: process.env.GROQ_MODEL_FALLBACK || 'llama-3.1-8b-instant',
  
  // OpenAI Models
  OPENAI_CHAT: process.env.OPENAI_MODEL || 'gpt-4o-mini',
};

// ============================================
// TOKEN BUDGET CONFIGURATION
// ============================================
export const TOKEN_BUDGETS = {
  // Validation thresholds
  MIN_VALID_TOKENS: 200,
  MIN_VALID_TOKENS_BASE: 512,
  
  // Base token budgets
  BASE_BUDGET: parseInt(process.env.TOKEN_BASE_BUDGET, 10) || 3200,
  LESSON_BUDGET_DEFAULT: parseInt(process.env.TOKEN_LESSON_DEFAULT, 10) || 3000,
  LESSON_BUDGET_MAX: parseInt(process.env.TOKEN_LESSON_MAX, 10) || 8192,
  
  // Outline/structure budgets
  OUTLINE_BUDGET_DEFAULT: parseInt(process.env.TOKEN_OUTLINE_DEFAULT, 10) || 900,
  OUTLINE_BUDGET_MAX: parseInt(process.env.TOKEN_OUTLINE_MAX, 10) || 2000,
  
  // Global and fallback
  GLOBAL_BUDGET_MAX: parseInt(process.env.TOKEN_GLOBAL_MAX, 10) || 8192,
  FALLBACK_BUDGET_MAX: parseInt(process.env.TOKEN_FALLBACK_MAX, 10) || 2048,
  
  // Temperature (controls randomness of responses)
  TEMPERATURE_STANDARD: 0.7,
  TEMPERATURE_LEARNING: 0.58,
};

// ============================================
// LEARNING CONFIGURATION
// ============================================
export const LEARNING = {
  // Lesson counts
  DEFAULT_LESSON_COUNT: parseInt(process.env.DEFAULT_LESSON_COUNT, 10) || 5,
  LESSONS_MIN: 3,
  LESSONS_MAX: 12,
  
  // Estimated time per lesson (minutes)
  ESTIMATED_TIME_PER_LESSON: 20,
  
  // Temperature for learning material generation
  TEMPERATURE: 0.58,
};

// ============================================
// SYSTEM PROMPTS
// ============================================
export const SYSTEM_PROMPTS = {
  ACADEMIC_ASSISTANT: `You are an Academic Study Assistant for students. Your role is to help students learn effectively by:

1. Answering doubts and questions on any subject
2. Summarizing complex concepts in simple terms
3. Suggesting personalized learning plans
4. Explaining topics with examples
5. Helping with exam preparation

Be friendly, encouraging, and patient. Use simple language suitable for students. When appropriate, provide examples and practical applications.`,

  LEARNING_EXPERT: `You are a Learning Expert. Design comprehensive, structured learning content that is:
- Clear and progressive
- Engaging with practical examples
- Assessment-focused with checkpoints`,
};

// ============================================
// PROMPT TEMPLATES
// ============================================
export const PROMPT_TEMPLATES = {
  QUIZ_FROM_DOCUMENT: (content) => `Convert this content into skill-testing multiple choice questions:

${content}

Generate 10 questions that test understanding and application, not just recall.

Return ONLY valid JSON as an array of questions.`,

  QUIZ_FROM_TOPIC: (topic, level) => `Generate comprehensive skill-testing quiz questions on topic: ${topic}. 

Target difficulty level: ${level}.

The questions should test practical understanding and application of concepts related to ${topic}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${level} level learner should know about ${topic}.

Return ONLY valid JSON as an array of questions.`,

  COURSE_OUTLINE: (topic, level, lessonCount, style = '', personalization = '') => `You are a curriculum architect. Design a ${lessonCount}-lesson course outline ONLY for the topic below.

TOPIC: ${topic}
LEVEL: ${level}
STYLE: ${style}
${personalization}

Rules:
- EXACTLY ${lessonCount} lessons, logical progression, no overlap in scope.
- Titles are specific (not "Introduction" alone — include the angle).

Return ONE JSON object (no markdown):
{
  "courseTitle": "string (engaging course title)",
  "outline": [
    { "lesson": 1, "title": "string" },
    { "lesson": 2, "title": "string" }
  ]
}
The "outline" array MUST have exactly ${lessonCount} items with lesson numbers 1..${lessonCount}.`,
};

// ============================================
// HELPER FUNCTION - GET TOKEN BUDGET
// ============================================
/**
 * Get token budget for a specific learning step
 * @param {string} stepType - Type of step (outline, lesson, supplement)
 * @param {number} maxTokens - Optional max tokens from env
 * @returns {number} - Token budget for this step
 */
export function getTokenBudget(stepType = 'base', maxTokens = null) {
  const envMax = maxTokens || TOKEN_BUDGETS.GLOBAL_BUDGET_MAX;
  
  switch (stepType) {
    case 'outline':
      return Math.min(TOKEN_BUDGETS.OUTLINE_BUDGET_DEFAULT, TOKEN_BUDGETS.OUTLINE_BUDGET_MAX);
    
    case 'lesson':
      const lessonBudget = Token_BUDGETS.LESSON_BUDGET_DEFAULT;
      return Math.min(lessonBudget, TOKEN_BUDGETS.LESSON_BUDGET_MAX);
    
    case 'supplement':
      return Math.min(TOKEN_BUDGETS.BASE_BUDGET, envMax);
    
    default:
      return TOKEN_BUDGETS.BASE_BUDGET;
  }
}

export default {
  AI_MODELS,
  TOKEN_BUDGETS,
  LEARNING,
  SYSTEM_PROMPTS,
  PROMPT_TEMPLATES,
  getTokenBudget,
};
