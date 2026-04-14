const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { safeParseJson } = require('../utils/jsonParser');
const { log, logError, logSuccess } = require('../utils/logger');

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const GEMINI_MODEL = process.env.GEMINI_QUIZ_MODEL || 'gemini-2.5-flash';
const OPENAI_MODEL = process.env.OPENAI_QUIZ_MODEL || 'gpt-4o-mini';
const MAX_GEMINI_RETRIES = Number(process.env.GEMINI_QUIZ_RETRIES || 3);
const RETRY_BASE_DELAY_MS = Number(process.env.GEMINI_RETRY_DELAY_MS || 1200);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is429Error(error) {
  if (!error) return false;
  const status = error.status || error.code || error?.response?.status;
  const message = String(error.message || '').toLowerCase();
  return status === 429 || message.includes('429') || message.includes('quota') || message.includes('rate limit');
}

function extractJsonCandidate(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return trimmed;
}

function normalizeQuestions(raw, questionCount = 10) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.questions)
      ? raw.questions
      : [];

  const normalized = list
    .map((q) => {
      const options = Array.isArray(q?.options)
        ? q.options.map((opt) => String(opt).trim()).filter(Boolean)
        : [];

      if (!q?.question || options.length < 2) return null;

      const answer = q.answer || q.correctAnswer || options[0];
      let normalizedAnswer = answer;

      if (typeof answer === 'string' && /^[A-D]$/i.test(answer) && options.length > 0) {
        const idx = answer.toUpperCase().charCodeAt(0) - 65;
        normalizedAnswer = options[idx] || options[0];
      } else if (typeof answer === 'number' && options.length > 0) {
        normalizedAnswer = options[answer] || options[0];
      }

      return {
        question: String(q.question).trim(),
        options: options.slice(0, 4),
        answer: String(normalizedAnswer || options[0]).trim(),
        explanation: q.explanation ? String(q.explanation).trim() : '',
        category: q.category ? String(q.category).trim() : ''
      };
    })
    .filter(Boolean);

  return normalized.slice(0, questionCount);
}

function hasValidQuizData(questions) {
  return Array.isArray(questions)
    && questions.length > 0
    && questions.every((q) => q.question && Array.isArray(q.options) && q.options.length >= 2 && q.answer);
}

function buildQuizPrompt(pdfText, { topic = 'Document Quiz', difficulty = 'intermediate', technicalLevel = 'intermediate', questionCount = 10 } = {}) {
  const level = technicalLevel || difficulty || 'intermediate';
  const safeText = String(pdfText || '').slice(0, 16000);

  return `
You are an expert quiz generator.

Generate ${questionCount} high-quality MCQ questions from the provided content.
Topic: ${topic}
Difficulty: ${level}

Rules:
1. Return ONLY valid JSON.
2. Output must be an array.
3. Each object must contain:
   - question
   - options (exactly 4 options)
   - answer (must match one option text, not only A/B/C/D)
   - explanation
   - category
4. Questions should test understanding, not copy exact lines.
5. Avoid duplicate questions.

JSON format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Why this is correct",
    "category": "Category"
  }
]

Content:
${safeText}
`;
}

async function generateWithGemini(pdfText, options = {}) {
  if (!genAI) throw new Error('Gemini not configured');

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = buildQuizPrompt(pdfText, options);

  for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt++) {
    try {
      log(`Gemini quiz attempt ${attempt}/${MAX_GEMINI_RETRIES}`);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const rawText =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || (typeof result?.response?.text === 'function' ? result.response.text() : '');
      const candidate = extractJsonCandidate(rawText);
      const parsed = safeParseJson(candidate, []);
      const questions = normalizeQuestions(parsed, options.questionCount || 10);

      if (!hasValidQuizData(questions)) {
        throw new Error('Gemini returned empty or invalid quiz data');
      }

      logSuccess(`Gemini generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      logError(`Gemini quiz generation failed on attempt ${attempt}`, error);

      const shouldRetry = is429Error(error) && attempt < MAX_GEMINI_RETRIES;
      if (!shouldRetry) throw error;

      const waitMs = RETRY_BASE_DELAY_MS * attempt;
      log(`Gemini 429 detected. Retrying in ${waitMs}ms...`);
      await delay(waitMs);
    }
  }

  throw new Error('Gemini retries exhausted');
}

async function generateWithOpenAI(pdfText, options = {}) {
  if (!openai) throw new Error('OpenAI not configured');

  const prompt = buildQuizPrompt(pdfText, options);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You generate strict JSON quiz output only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 2200,
    response_format: { type: 'json_object' }
  });

  const rawText = completion?.choices?.[0]?.message?.content;
  const candidate = extractJsonCandidate(rawText);
  const parsed = safeParseJson(candidate, {});
  const questions = normalizeQuestions(parsed, options.questionCount || 10);

  if (!hasValidQuizData(questions)) {
    throw new Error('OpenAI returned empty or invalid quiz data');
  }

  logSuccess(`OpenAI generated ${questions.length} questions`);
  return questions;
}

function extractKeywords(text) {
  const SAFE_TEXT = String(text || '').toLowerCase();
  const predefined = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node', 'express', 'mongodb',
    'sql', 'postgresql', 'aws', 'docker', 'kubernetes', 'machine learning', 'ai',
    'data science', 'devops', 'btech', 'cloud', 'api', 'git', 'github'
  ];

  const found = predefined.filter((k) => SAFE_TEXT.includes(k));
  const tokenMatches = SAFE_TEXT.match(/\b[a-z][a-z0-9+#.-]{3,20}\b/g) || [];

  const tokenFreq = tokenMatches.reduce((acc, token) => {
    if (token.length < 4) return acc;
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  const rankedTokens = Object.entries(tokenFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([token]) => token);

  const merged = [...new Set([...found, ...rankedTokens])];
  return merged.slice(0, 12);
}

function buildKeywordQuestion(keyword) {
  const label = keyword.toUpperCase();

  return {
    question: `What best describes the role of ${label} in a technical project?`,
    options: [
      `${label} is used to solve a core part of the project workflow`,
      `${label} is only for UI colors and styling decisions`,
      `${label} is unrelated to software development`,
      `${label} can never be combined with other tools`
    ],
    answer: `${label} is used to solve a core part of the project workflow`,
    explanation: `${label} usually contributes to a concrete technical task in the project lifecycle. Good solutions combine tools based on project needs and constraints.`,
    category: 'Concept Understanding'
  };
}

function generateBasicQuiz(pdfText, options = {}) {
  const questionCount = options.questionCount || 10;
  const topic = options.topic || 'General Technology';
  const keywords = extractKeywords(pdfText);

  const questions = [];

  if (keywords.length) {
    for (const keyword of keywords) {
      questions.push(buildKeywordQuestion(keyword));
      if (questions.length >= questionCount) break;
    }
  }

  while (questions.length < questionCount) {
    questions.push({
      question: `In ${topic}, which approach is usually most effective for improving real-world problem-solving?`,
      options: [
        'Practice with projects and apply concepts step by step',
        'Memorize terms without implementation',
        'Skip fundamentals and only read summaries',
        'Avoid testing and debugging'
      ],
      answer: 'Practice with projects and apply concepts step by step',
      explanation: 'Practical application builds deeper understanding than passive memorization. Iterative implementation, testing, and refinement improves long-term skill.',
      category: 'Applied Skills'
    });
  }

  return questions.slice(0, questionCount);
}

async function generateQuiz(pdfText, options = {}) {
  if (!pdfText || String(pdfText).trim().length < 100) {
    return {
      success: false,
      error: 'Quiz generation failed'
    };
  }

  try {
    const geminiQuestions = await generateWithGemini(pdfText, options);
    if (hasValidQuizData(geminiQuestions)) {
      return { success: true, source: 'gemini', data: geminiQuestions };
    }
  } catch (error) {
    logError('Gemini generation failed', error);
  }

  try {
    const openaiQuestions = await generateWithOpenAI(pdfText, options);
    if (hasValidQuizData(openaiQuestions)) {
      return { success: true, source: 'openai', data: openaiQuestions };
    }
  } catch (error) {
    logError('OpenAI generation failed', error);
  }

  try {
    const fallbackQuestions = generateBasicQuiz(pdfText, options);
    if (hasValidQuizData(fallbackQuestions)) {
      log('Using local fallback quiz generator');
      return { success: true, source: 'fallback', data: fallbackQuestions };
    }
  } catch (error) {
    logError('Fallback quiz generation failed', error);
  }

  return {
    success: false,
    error: 'Quiz generation failed'
  };
}

module.exports = {
  generateQuiz,
  generateWithGemini,
  generateWithOpenAI,
  generateBasicQuiz
};
