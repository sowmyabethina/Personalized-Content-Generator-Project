/**
 * Quiz Service
 * Handles quiz database operations
 */

import { db } from "../config/database.js";
import { logError, logSuccess, log } from "../utils/logger.js";

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

    const quizData = result.rows.map(row => ({
      originalIndex: row.question_index,
      question: row.question,
      options: row.options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation
    }));

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
  const { ans, opts, originalIndex, ...rest } = question;
  const answer = ans;
  const options = Array.isArray(opts) ? opts : [];
  let normalizedAns = answer;

  // Convert letter to full text
  if (typeof answer === 'string' && /^[A-D]$/i.test(answer) && options.length > 0) {
    const ansIdx = answer.toUpperCase().charCodeAt(0) - 65;
    normalizedAns = options[ansIdx] || options[0];
  }
  // Convert index to full text
  if (typeof answer === 'number' && options.length > 0) {
    normalizedAns = options[answer] || options[0];
  }
  if (!answer) {
    normalizedAns = '';
  }

  return {
    originalIndex,
    question: question.question,
    options,
    correctAnswer: normalizedAns,
    explanation: question.explanation || '',
    category: question.category || '',
    ...rest
  };
}

/**
 * Score quiz answers
 * @param {Array} storedQuiz - Stored quiz questions
 * @param {Array} userAnswers - User's answers
 * @returns {Object} - Score result with details
 */
function scoreQuizAnswers(storedQuiz, userAnswers) {
  let correct = 0;
  const results = userAnswers.map((userAnswer, idx) => {
    const questionData = storedQuiz[idx];
    const isCorrect = userAnswer === questionData.correctAnswer;
    if (isCorrect) correct++;
    
    return {
      questionIndex: idx,
      question: questionData.question,
      userAnswer,
      correctAnswer: questionData.correctAnswer,
      isCorrect
    };
  });
  
  const totalQuestions = storedQuiz.length;
  const score = Math.round((correct / totalQuestions) * 100);
  
  return {
    score,
    correct,
    total: totalQuestions,
    results
  };
}

export {
  storeQuiz,
  getQuiz,
  storeQuizResult,
  generateQuizId,
  normalizeQuizAnswer,
  scoreQuizAnswers,
  cacheQuiz,
};
export default {
  storeQuiz,
  getQuiz,
  storeQuizResult,
  generateQuizId,
  normalizeQuizAnswer,
  scoreQuizAnswers,
  cacheQuiz,
};
