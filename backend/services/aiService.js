/**
 * AI Service
 * Handles all AI (Gemini) operations
 */

import { genAI, getModel } from "../config/ai.js";
import { parseJson } from "../utils/jsonParser.js";
import { logError } from "../utils/logger.js";

/**
 * Generate quiz questions from text or topic
 * @param {string} text - Document text or topic
 * @param {Object} options - Quiz generation options
 * @returns {Array} - Array of quiz questions
 */
async function generateQuizQuestions(text, options = {}) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');
  const prompt = buildQuizPrompt(text, options);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output');
  }

  return parseJson(rawText);
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

Generate questions that a ${technicalLevel || difficulty} level learner should know about ${text}.`;
  }
  
  // Text is actual content - generate from it
  return `Convert this content into skill-testing multiple choice questions:

${text}

Generate 10 questions that test understanding and application, not just recall.`;
}

/**
 * Generate learning material for a topic
 * @param {string} topic - Learning topic
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Object} - Generated learning material
 */
async function generateLearningMaterial(topic, technicalLevel, learningStyle) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');

  const prompt = `You are an expert technical educator. Generate comprehensive, structured learning material for the following:

Topic: ${topic}
Technical Level: ${technicalLevel}
Learning Style: ${learningStyle}

Create detailed learning material with the following structure in JSON format:

{
  "title": "Complete ${topic} Learning Guide",
  "topic": "${topic}",
  "level": "${technicalLevel}",
  "style": "${learningStyle}",
  "summary": "A comprehensive overview tailored for ${learningStyle} learners at ${technicalLevel} level",
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed paragraph(s) explaining the concept with real-world applications and context (2-3 paragraphs)",
      "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "examples": [
        {
          "title": "Example Title",
          "description": "Detailed description of what this example demonstrates",
          "code": "Code snippet or practical example"
        }
      ],
      "applications": ["Real-world application 1", "Real-world application 2"],
      "practiceQuestions": ["Question 1", "Question 2", "Question 3"],
      "estimatedTime": "20 minutes"
    }
  ],
  "finalProject": {
    "title": "Capstone Project: [Project Name]",
    "description": "A comprehensive project that combines all concepts learned",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "expectedOutcome": "What learners will achieve after completing this project"
  },
  "cheatsheet": {
    "commands": ["Command 1", "Command 2", "Command 3"],
    "definitions": {
      "Term 1": "Definition",
      "Term 2": "Definition"
    }
  },
  "furtherReading": ["Resource 1", "Resource 2", "Resource 3"],
  "learningTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Requirements:
- Generate 4-5 comprehensive sections covering different aspects of ${topic}
- Each section should have detailed explanations with practical applications
- Include code examples where applicable
- Provide multiple key points and practice questions per section
- The content should be suitable for a ${learningStyle} learner at ${technicalLevel} level
- Include real-world scenarios and use cases
- Make it engaging and practical

Return ONLY valid JSON, no additional text.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for learning material');
  }

  return parseJson(rawText);
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
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');

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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for quiz');
  }

  // Try parsing JSON, if direct text return raw
  try {
    return parseJson(rawText);
  } catch {
    return rawText;
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
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');
  
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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for content');
  }

  return parseJson(rawText);
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
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');
  
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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for combined content');
  }

  return parseJson(rawText);
}

/**
 * Generate learning style assessment questions
 * @param {Object} userProfile - User profile
 * @param {string} topic - Topic
 * @returns {Array} - Assessment questions
 */
async function generateFromPdf(userProfile, topic) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = getModel('gemini-2.5-flash');
  
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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (rawText) {
    return parseJson(rawText);
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
