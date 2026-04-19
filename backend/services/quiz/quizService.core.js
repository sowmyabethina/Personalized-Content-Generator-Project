/**
 * Quiz Service Core Layer
 * Contains all business logic for quiz operations
 * 
 * This is the SINGLE SOURCE OF TRUTH for quiz logic.
 * Controllers call these functions to execute business logic.
 */

import { db } from "../../config/database.js";
import { logError, logSuccess, log } from "../../utils/logger.js";
import { generateQuestionsFromTopic, generateQuizFromMaterial } from "../aiService.js";
import { analyzePsychometricProfile, getTechnicalLevel } from "../../utils/psychometricQuiz.js";

console.log("quizService.core loaded");

/**
 * Generate cache key from topic
 */
function getCacheKey(topic) {
  return `quiz_${(topic || '').toLowerCase().trim()}`;
}

/**
 * Generate unique quiz ID
 */
function generateQuizId() {
  return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Normalize quiz question data from AI response
 */
function normalizeQuizAnswer(question) {
  return {
    originalIndex: question.originalIndex ?? 0,
    question: question.question ?? '',
    options: Array.isArray(question.options) ? question.options : [],
    correctAnswer: question.ans ?? question.answer ?? '',
    explanation: question.explanation ?? ''
  };
}

/**
 * Check if two answers match (normalized comparison)
 */
function answersMatch(userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return false;
  const user = String(userAnswer).toLowerCase().trim();
  const correct = String(correctAnswer).toLowerCase().trim();
  return user === correct || user.includes(correct) || correct.includes(user);
}

/**
 * Score client-side quiz answers (no DB storage)
 */
function scoreClientQuizAnswers(answers, questions) {
  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  if (totalQuestions === 0) {
    return { score: 0, correct: 0, total: 0, results: [] };
  }
  
  let correct = 0;
  const results = [];
  const answerList = Array.isArray(answers) ? answers : [];
  
  for (let idx = 0; idx < totalQuestions; idx++) {
    const q = questions[idx];
    const expected = q?.answer ?? q?.correctAnswer ?? "";
    const userAnswer = answerList[idx] != null ? answerList[idx] : "";
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
    score: Math.round((correct / totalQuestions) * 100),
    correct,
    total: totalQuestions,
    results,
  };
}

/**
 * Score stored quiz answers with DB storage
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
 * CORE: Generate quiz from text or topic
 * @param {Object} params
 * @param {string} params.docText - Document text (optional)
 * @param {string} params.topic - Topic name (optional)
 * @param {string} params.difficulty - Difficulty level
 * @param {string} params.technicalLevel - Technical level
 * @returns {Promise<Object>} { quizId, questions }
 */
async function generateQuizCore({ docText, topic, difficulty, technicalLevel }) {
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
    ans: q.answer ?? q.correctAnswer,
    explanation: q.explanation || '',
    category: q.category || ''
  }));

  // Store in database
  await storeQuizCore(quizId, quizData, quizTopic);

  log(`Quiz generated: ${quizId}`);

  return {
    quizId,
    questions: quizData
  };
}

/**
 * CORE: Generate quiz from learning material
 */
async function generateQuizFromMaterialCore({ topic, material, technicalLevel, learningStyle }) {
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

  await storeQuizCore(quizId, quizData, topic);

  log(`Quiz generated from material: ${quizId}`);

  return {
    quizId,
    questions: quizData
  };
}

/**
 * CORE: Score combined technical + learning quiz
 * Combines stored quiz scoring with client-side learning scoring
 */
function scoreQuizCombinedCore({
  quizData = null,
  storedAnswers = [],
  clientQuestions = [],
  clientAnswers = [],
  learningQuestions = [],
  learningAnswers = []
}) {
  let techScore = 0;
  let techCorrect = 0;
  let techTotal = 0;

  // Score stored quiz if available
  if (Array.isArray(quizData) && quizData.length > 0) {
    const scoreResult = scoreQuizAnswers(quizData, storedAnswers);
    techScore = scoreResult.score;
    techCorrect = scoreResult.correct;
    techTotal = scoreResult.total;
  }
  // Fallback to client-side scoring
  else if (Array.isArray(clientQuestions) && clientQuestions.length > 0) {
    const scoreResult = scoreClientQuizAnswers(clientAnswers, clientQuestions);
    techScore = scoreResult.score;
    techCorrect = scoreResult.correct;
    techTotal = scoreResult.total;
  }

  // Score learning assessment
  const learningScore = learningQuestions.length
    ? Math.round(
        (learningAnswers.reduce((sum, v) => sum + Number(v || 0), 0) /
          (learningQuestions.length * 2)) *
          100
      )
    : 0;

  // Analyze psychometric profile
  const psychometricProfile = learningAnswers.length
    ? analyzePsychometricProfile(learningAnswers)
    : null;
  
  // Determine technical level
  const technicalLevel = getTechnicalLevel(techScore);
  
  // Generate combined analysis
  const combinedAnalysis = psychometricProfile
    ? `Technical: ${technicalLevel} level based on quiz score. Learning preference determined through assessment.`
    : null;

  return {
    score: techScore,
    correct: techCorrect,
    total: techTotal,
    learningScore,
    technicalLevel,
    psychometricProfile,
    combinedAnalysis
  };
}

/**
 * Store quiz in database
 */
async function storeQuizCore(quizId, quizData, topic) {
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

    logSuccess(`Quiz stored: ${quizId}`);
    return true;
  } catch (err) {
    logError('Error storing quiz', err);
    return false;
  }
}

/**
 * Get quiz from database
 */
async function getQuizCore(quizId) {
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
        explanation: row.explanation
      };
    });

    return {
      quizData,
      totalQuestions: quizData.length
    };
  } catch (err) {
    logError('Error fetching quiz', err);
    return null;
  }
}

/**
 * Store quiz result in database
 */
async function storeQuizResultCore(quizId, answers, score, correctCount, totalCount) {
  try {
    await db.query(
      `INSERT INTO quiz_results (quiz_id, answers, score, correct_answers, total_questions, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [quizId, JSON.stringify(answers), score, correctCount, totalCount]
    );

    logSuccess(`Quiz result stored: ${quizId} - Score: ${score}%`);
    return true;
  } catch (err) {
    logError('Error storing quiz result', err);
    return false;
  }
}

export {
  generateQuizCore,
  generateQuizFromMaterialCore,
  scoreQuizCombinedCore,
  scoreQuizAnswers,
  scoreClientQuizAnswers,
  storeQuizCore,
  getQuizCore,
  storeQuizResultCore,
  generateQuizId,
  normalizeQuizAnswer,
  answersMatch,
};

export default {
  generateQuizCore,
  generateQuizFromMaterialCore,
  scoreQuizCombinedCore,
  scoreQuizAnswers,
  scoreClientQuizAnswers,
  storeQuizCore,
  getQuizCore,
  storeQuizResultCore,
};
