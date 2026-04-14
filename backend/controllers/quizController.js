/**
 * Quiz Controller
 * Handles quiz route logic (req/res handling)
 * 
 * MUST be thin - ONLY receives req/res, calls services, returns response
 */

import {
  storeQuiz,
  getQuiz,
  storeQuizResult,
  generateQuizId,
  normalizeQuizAnswer,
  scoreQuizAnswers,
  scoreClientQuizAnswers,
  cacheQuiz,
} from "../services/quizService.js";
import {
  analyzePsychometricProfile,
  getTechnicalLevel,
} from "../utils/psychometricQuiz.js";
import { generateQuestionsFromTopic, generateQuizFromMaterial } from "../services/aiService.js";
import { handleError } from "../utils/errorHandler.js";
import { log } from "../utils/logger.js";

/**
 * Generate quiz - handles /quiz/generate
 * Expects: { docText?, topic?, difficulty?, technicalLevel? }
 */
async function generateQuiz(req, res) {
  try {
    const { docText, topic, difficulty, technicalLevel } = req.body;
    let text = '';
    let quizTopic = topic;

    // Input validation - build text or use docText
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
      return res.status(400).json({ error: 'docText or topic required' });
    }

    // Call service to generate questions
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

    // Cache for future requests (optional optimization)
    cacheQuiz(quizTopic, quizData);

    log(`Quiz generated: ${quizId}`);

    res.setHeader('X-Quiz-Id', quizId);
    return res.json(quizData);

  } catch (err) {
    const errorResponse = handleError(err, '/quiz/generate');
    return res.status(errorResponse.status).json({ error: errorResponse.error, message: errorResponse.message });
  }
}

/**
 * Score quiz - handles /quiz/score-quiz
 * Expects: { quizId, answers: [] }
 */
async function scoreQuiz(req, res) {
  try {
    const { quizId, answers, topic, githubSkills, resumeSkills } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quizId and answers array required' });
    }

    // Get quiz from database
    const quizData = await getQuiz(quizId);

    if (!quizData) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { quizData: storedQuiz, totalQuestions } = quizData;

    // Score using service function
    const scoreResult = scoreQuizAnswers(storedQuiz, answers);

    // Store result in database
    await storeQuizResult(quizId, answers, scoreResult.score, scoreResult.correct, totalQuestions);

    // Evaluate skill level by combining quiz result with profile signals
    let skillEvaluation = null;
    try {
      const { evaluateSkillLevel } = await import('../agents/skillEvaluationAgent.js');

      skillEvaluation = await evaluateSkillLevel({
        quizScore: scoreResult.score,
        totalQuestions: scoreResult.total,
        topic: topic || '',
        githubSkills: Array.isArray(githubSkills) ? githubSkills : [],
        resumeSkills: Array.isArray(resumeSkills) ? resumeSkills : []
      });
    } catch (evalErr) {
      // do not fail scoring completely if evaluation fails
      skillEvaluation = { error: 'Skill evaluation failed', details: evalErr.message };
    }

    return res.json({
      ...scoreResult,
      skillEvaluation
    });

  } catch (err) {
    const errorResponse = handleError(err, '/quiz/score-quiz');
    return res.status(500).json({ error: 'Scoring failed', details: err.message });
  }
}

/**
 * Generate quiz from material - handles /quiz/generate-quiz-from-material
 * Expects: { topic, material, technicalLevel?, learningStyle? }
 */
async function handleGenerateQuizFromMaterial(req, res) {
  try {
    const { topic, material, technicalLevel, learningStyle } = req.body;

    if (!topic || !material) {
      return res.status(400).json({ error: 'topic and material required' });
    }

    // Call AI service directly (this handles the material-based generation)
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

    res.setHeader('X-Quiz-Id', quizId);
    return res.json(quizData);

  } catch (err) {
    const errorResponse = handleError(err, '/quiz/generate-quiz-from-material');
    return res.status(500).json({ error: 'Quiz generation failed', details: err.message });
  }
}

/**
 * POST /api/quiz/score — combined technical + learning scoring (matches frontend submitQuiz success shape).
 * Body: { quizId?, answers?, questions?, learningAnswers?, learningQuestions?, topic? }
 */
async function processQuizScore(req, res) {
  try {
    const {
      quizId,
      answers = [],
      questions = [],
      learningAnswers = [],
      learningQuestions = [],
    } = req.body || {};

    const answerList = Array.isArray(answers) ? answers : [];
    const questionList = Array.isArray(questions) ? questions : [];

    let correct = 0;
    let score = 0;
    let total = 0;

    const stored = quizId ? await getQuiz(quizId) : null;

    if (stored?.quizData?.length) {
      const scoreResult = scoreQuizAnswers(stored.quizData, answerList);
      correct = scoreResult.correct;
      score = scoreResult.score;
      total = scoreResult.total;
      try {
        await storeQuizResult(
          quizId,
          answerList,
          scoreResult.score,
          scoreResult.correct,
          stored.totalQuestions
        );
      } catch (storeErr) {
        log("processQuizScore: storeQuizResult skipped", { details: storeErr.message });
      }
    } else if (questionList.length > 0) {
      const scoreResult = scoreClientQuizAnswers(answerList, questionList);
      correct = scoreResult.correct;
      score = scoreResult.score;
      total = scoreResult.total;
    }

    const learningScore = learningQuestions.length
      ? Math.round(
          (learningAnswers.reduce((sum, v) => sum + Number(v || 0), 0) /
            (learningQuestions.length * 2)) *
            100
        )
      : 0;

    const psychometricProfile = learningAnswers.length
      ? analyzePsychometricProfile(learningAnswers)
      : null;
    const technicalLevel = getTechnicalLevel(score);
    const combinedAnalysis = psychometricProfile
      ? `Technical: ${technicalLevel} level based on quiz score. Learning preference determined through assessment.`
      : null;

    return res.json({
      correct,
      score,
      total,
      learningScore,
      technicalLevel,
      psychometricProfile,
      combinedAnalysis,
    });
  } catch (err) {
    const errorResponse = handleError(err, "/api/quiz/score");
    return res
      .status(errorResponse.status || 500)
      .json({ error: "Quiz processing failed", details: err.message });
  }
}

export { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial, processQuizScore };
export default { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial, processQuizScore };
