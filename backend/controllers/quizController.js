/**
 * Quiz Controller
 * Thin HTTP request/response layer ONLY
 * All business logic delegated to quizService.core
 */

import {
  generateQuizCore,
  generateQuizFromMaterialCore,
  scoreQuizCombinedCore,
  getQuizCore,
  storeQuizResultCore,
  scoreQuizAnswers
} from "../services/quiz/quizService.core.js";
import { handleError } from "../utils/errorHandler.js";
import { log } from "../utils/logger.js";

/**
 * Generate quiz - thin wrapper for /quiz/generate
 */
async function generateQuiz(req, res) {
  try {
    const { docText, topic, difficulty, technicalLevel } = req.body;

    if (!docText?.trim() && !topic?.trim()) {
      return res.status(400).json({ error: 'docText or topic required' });
    }

    const result = await generateQuizCore({ docText, topic, difficulty, technicalLevel });
    
    res.setHeader('X-Quiz-Id', result.quizId);
    return res.json(result.questions);

  } catch (err) {
    const errorResponse = handleError(err, '/quiz/generate');
    return res.status(errorResponse.status).json({ error: errorResponse.error, message: errorResponse.message });
  }
}

/**
 * Score quiz - thin wrapper for /quiz/score-quiz
 */
async function scoreQuiz(req, res) {
  try {
    const { quizId, answers, topic, githubSkills, resumeSkills } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quizId and answers array required' });
    }

    const quizData = await getQuizCore(quizId);

    if (!quizData) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { quizData: storedQuiz, totalQuestions } = quizData;
    const scoreResult = scoreQuizAnswers(storedQuiz, answers);

    await storeQuizResultCore(quizId, answers, scoreResult.score, scoreResult.correct, totalQuestions);

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
 * Generate quiz from material - thin wrapper for /quiz/generate-quiz-from-material
 */
async function handleGenerateQuizFromMaterial(req, res) {
  try {
    const { topic, material, technicalLevel, learningStyle } = req.body;

    if (!topic || !material) {
      return res.status(400).json({ error: 'topic and material required' });
    }

    const result = await generateQuizFromMaterialCore({
      topic,
      material,
      technicalLevel,
      learningStyle
    });

    res.setHeader('X-Quiz-Id', result.quizId);
    return res.json(result.questions);

  } catch (err) {
    const errorResponse = handleError(err, '/quiz/generate-quiz-from-material');
    return res.status(500).json({ error: 'Quiz generation failed', details: err.message });
  }
}

/**
 * Process quiz score - thin wrapper for /api/quiz/score
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

    const quizData = quizId ? await getQuizCore(quizId) : null;
    const storedQuizData = quizData?.quizData || null;

    const result = scoreQuizCombinedCore({
      quizData: storedQuizData,
      storedAnswers: Array.isArray(answers) ? answers : [],
      clientQuestions: Array.isArray(questions) ? questions : [],
      clientAnswers: Array.isArray(answers) ? answers : [],
      learningQuestions: Array.isArray(learningQuestions) ? learningQuestions : [],
      learningAnswers: Array.isArray(learningAnswers) ? learningAnswers : []
    });

    if (quizId && storedQuizData) {
      try {
        await storeQuizResultCore(
          quizId,
          answers,
          result.score,
          result.correct,
          storedQuizData.length
        );
      } catch (storeErr) {
        log("processQuizScore: storeQuizResultCore skipped", { details: storeErr.message });
      }
    }

    return res.json(result);

  } catch (err) {
    const errorResponse = handleError(err, "/api/quiz/score");
    return res
      .status(errorResponse.status || 500)
      .json({ error: "Quiz processing failed", details: err.message });
  }
}

export { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial, processQuizScore };
export default { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial, processQuizScore };
