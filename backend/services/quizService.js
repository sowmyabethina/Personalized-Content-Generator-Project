/**
 * Quiz Service
 * Handles quiz database operations and business logic
 */

import { db } from "../config/database.js";
import { logError, logSuccess, log } from "../utils/logger.js";
import { generateQuestionsFromTopic, generateQuizFromMaterial } from "./aiService.js";

// Simple in-memory cache for recently generated quizzes
// Format: { [topicKey]: { quizId, timestamp, quizData } }
const quizCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from topic
 * @param {string} topic - Topic
 * @returns {string} - Cache key
 */
function getCacheKey(topic) {
  return `quiz_${(topic || '').toLowerCase().trim()}`;
}

/**
 * Cache a generated quiz
 * @param {string} topic - Topic
 * @param {Array} quizData - Quiz data
 */
function cacheQuiz(topic, quizData) {
  const key = getCacheKey(topic);
  quizCache.set(key, {
    quizData,
    timestamp: Date.now()
  });
  log(`Cached quiz for topic: ${topic}`);
}

/**
 * Store a quiz in the database
 * @param {string} quizId - Unique quiz ID
 * @param {Array} quizData - Quiz questions data
 * @param {string} topic - Quiz topic
 * @returns {boolean} - Success status
 */
async function storeQuiz(quizId, quizData, topic) {
  try {
    await db.query(
      `INSERT INTO quizzes (id, topic, created_at, expires_at) 
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours') 
       ON CONFLICT (id) DO NOTHING`,
      [quizId, topic || 'Quiz']
    );

    for (const q of quizData) {
      await db.query(
        `INSERT INTO quiz_questions (quiz_id, question_index, question, options, correct_answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quizId, q.originalIndex, q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation || null]
      );
    }

    logSuccess(`Quiz stored in database: ${quizId}`);
    return true;
  } catch (err) {
    logError('Error storing quiz in database', err);
    return false;
  }
}

/**
 * Get a quiz from the database
 * @param {string} quizId - Quiz ID
 * @returns {Object|null} - Quiz data or null
 */
async function getQuiz(quizId) {
  try {
    const result = await db.query(
      `SELECT q.id, q.topic, q.created_at,
              qj.question_index, qj.question, qj.options, qj.correct_answer, qj.explanation
       FROM quizzes q
       JOIN quiz_questions qj ON q.id = qj.quiz_id
       WHERE q.id = $1
       ORDER BY qj.question_index`,
      [quizId]
    );

    if (result.rows.length === 0) return null;

    const quizData = result.rows.map((row) => {
      let options = row.options;
      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      if (!Array.isArray(options)) options = [];

      return {
        originalIndex: row.question_index,
        question: row.question,
        options,
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
      };
    });

    return {
      quizData,
      totalQuestions: quizData.length
    };
  } catch (err) {
    logError('Error getting quiz from database', err);
    return null;
  }
}

/**
 * Store quiz result in the database
 * @param {string} quizId - Quiz ID
 * @param {Array} answers - User answers
 * @param {number} score - Score percentage
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalCount - Total number of questions
 * @returns {boolean} - Success status
 */
async function storeQuizResult(quizId, answers, score, correctCount, totalCount) {
  try {
    await db.query(
      `INSERT INTO quiz_results (quiz_id, user_answers, score, correct_count, total_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [quizId, JSON.stringify(answers), score, correctCount, totalCount]
    );
    logSuccess(`Quiz result stored: ${quizId}`);
    return true;
  } catch (err) {
    logError('Error storing quiz result', err);
    return false;
  }
}

/**
 * Generate unique quiz ID
 * @returns {string} - Unique quiz ID
 */
function generateQuizId() {
  return `quiz_${Date.now()}`;
}

/**
 * Normalize quiz answers from various formats
 * @param {Object} question - Question object
 * @returns {Object} - Normalized question
 */
function normalizeQuizAnswer(question) {
  const { ans, originalIndex } = question;
  const rawOpts = question.options ?? question.opts;
  const options = Array.isArray(rawOpts) ? rawOpts : [];
  const answer = ans;
  let normalizedAns = answer;

  if (typeof answer === "string" && /^[A-D]$/i.test(answer) && options.length > 0) {
    const ansIdx = answer.toUpperCase().charCodeAt(0) - 65;
    normalizedAns = options[ansIdx] || options[0];
  }
  if (typeof answer === "number" && options.length > 0) {
    normalizedAns = options[answer] || options[0];
  }
  if (answer === undefined || answer === null || answer === "") {
    normalizedAns = "";
  }

  return {
    originalIndex,
    question: question.question,
    options,
    correctAnswer: normalizedAns,
    explanation: question.explanation || "",
    category: question.category || "",
  };
}

/**
 * Same semantics as frontend compareAnswer (trim + case-insensitive).
 */
function answersMatch(userAnswer, correctAnswer) {
  if (userAnswer == null || correctAnswer == null) return false;
  const u = String(userAnswer).trim().toLowerCase();
  const c = String(correctAnswer).trim().toLowerCase();
  return u.length > 0 && c.length > 0 && u === c;
}

/**
 * Score agent/client-held quizzes (questions use `answer` or `correctAnswer`).
 */
function scoreClientQuizAnswers(answers, questions) {
  const total = Array.isArray(questions) ? questions.length : 0;
  if (total === 0) {
    return { score: 0, correct: 0, total: 0, results: [] };
  }
  let correct = 0;
  const results = [];
  for (let idx = 0; idx < total; idx++) {
    const q = questions[idx];
    const expected = q?.answer ?? q?.correctAnswer ?? "";
    const userAnswer = answers[idx] != null ? answers[idx] : "";
    const isCorrect = answersMatch(userAnswer, expected);
    if (isCorrect) correct++;
    results.push({
      questionIndex: idx,
      question: q?.question,
      userAnswer,
      correctAnswer: expected,
      isCorrect,
    });
  }
  return {
    score: Math.round((correct / total) * 100),
    correct,
    total,
    results,
  };
}

/**
 * Score quiz answers
 * @param {Array} storedQuiz - Stored quiz questions
 * @param {Array} userAnswers - User's answers
 * @returns {Object} - Score result with details
 */
function scoreQuizAnswers(storedQuiz, userAnswers) {
  const totalQuestions = Array.isArray(storedQuiz) ? storedQuiz.length : 0;
  if (totalQuestions === 0) {
    return { score: 0, correct: 0, total: 0, results: [] };
  }

  let correct = 0;
  const results = [];
  const answers = Array.isArray(userAnswers) ? userAnswers : [];

  for (let idx = 0; idx < totalQuestions; idx++) {
    const questionData = storedQuiz[idx];
    const userAnswer = answers[idx] != null ? answers[idx] : "";
    const expected = questionData?.correctAnswer;
    const isCorrect = answersMatch(userAnswer, expected);
    if (isCorrect) correct++;

    results.push({
      questionIndex: idx,
      question: questionData?.question,
      userAnswer,
      correctAnswer: expected,
      isCorrect,
    });
  }

  const score = Math.round((correct / totalQuestions) * 100);

  return {
    score,
    correct,
    total: totalQuestions,
    results,
  };
}

/**
 * Generate new quiz from text or topic (full business logic)
 * @param {Object} params - Parameters
 * @param {string} params.docText - Document text (optional)
 * @param {string} params.topic - Topic name (optional)
 * @param {string} params.difficulty - Difficulty level
 * @param {string} params.technicalLevel - Technical level
 * @returns {Promise<Object>} - Quiz data with quizId
 */
async function generateNewQuiz({ docText, topic, difficulty, technicalLevel }) {
  let text = '';
  let quizTopic = topic;

  // Build prompt based on input
  if (docText && docText.trim().length > 100) {
    text = docText;
    quizTopic = quizTopic || 'Document Quiz';
  } else if (topic && topic.trim()) {
    const level = technicalLevel || difficulty || 'intermediate';
    text = `Generate comprehensive skill-testing quiz questions on topic: ${topic}. 

Target difficulty level: ${level}.

The questions should test practical understanding and application of concepts related to ${topic}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${level} level learner should know about ${topic}.`;
  } else {
    throw new Error('docText or topic required');
  }

  // Call AI service to generate questions
  const questions = await generateQuestionsFromTopic(text);
  
  if (!Array.isArray(questions)) {
    throw new Error('Invalid AI response');
  }

  // Create quiz ID and normalize data
  const quizId = generateQuizId();
  const quizData = questions.map((q, idx) => normalizeQuizAnswer({
    originalIndex: idx,
    question: q.question,
    options: Array.isArray(q.options) ? q.options : [],
    ans: q.answer,
    explanation: q.explanation || '',
    category: q.category || ''
  }));

  // Store in database
  await storeQuiz(quizId, quizData, quizTopic);

  // Cache for future requests
  cacheQuiz(quizTopic, quizData);

  log(`Quiz generated: ${quizId}`);

  return {
    quizId,
    questions: quizData
  };
}

/**
 * Generate quiz from learning material (full business logic)
 * @param {Object} params - Parameters
 * @param {string} params.topic - Quiz topic
 * @param {string} params.material - Learning material
 * @param {string} params.technicalLevel - Technical level (optional)
 * @param {string} params.learningStyle - Learning style (optional)
 * @returns {Promise<Object>} - Quiz data with quizId
 */
async function generateNewQuizFromMaterial({ topic, material, technicalLevel, learningStyle }) {
  if (!topic || !material) {
    throw new Error('topic and material required');
  }

  // Call AI service
  const questions = await generateQuizFromMaterial(topic, material, technicalLevel, learningStyle);

  const quizId = generateQuizId();
  
  const quizData = questions.map((q, idx) => ({
    originalIndex: idx,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.answer || q.options[0],
    explanation: q.explanation || ''
  }));

  await storeQuiz(quizId, quizData, topic);

  log(`Quiz generated from material: ${quizId}`);

  return {
    quizId,
    questions: quizData
  };
}

export {
  storeQuiz,
  getQuiz,
  storeQuizResult,
  generateQuizId,
  normalizeQuizAnswer,
  scoreQuizAnswers,
  scoreClientQuizAnswers,
  cacheQuiz,
  generateNewQuiz,
  generateNewQuizFromMaterial,
};
export default {
  storeQuiz,
  getQuiz,
  storeQuizResult,
  generateQuizId,
  normalizeQuizAnswer,
  scoreQuizAnswers,
  scoreClientQuizAnswers,
  cacheQuiz,
  generateNewQuiz,
  generateNewQuizFromMaterial,
};
