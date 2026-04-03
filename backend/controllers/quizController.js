/**
 * Quiz Controller
 * Handles quiz route logic (req/res handling)
 * 
 * MUST be thin - ONLY receives req/res, calls services, returns response
 */

const { storeQuiz, getQuiz, storeQuizResult, generateQuizId, normalizeQuizAnswer, scoreQuizAnswers, cacheQuiz } = require('../services/quizService');
const { generateQuestionsFromTopic } = require('../services/aiService');
const { handleError } = require('../utils/errorHandler');
const { log } = require('../utils/logger');

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
      throw new Error('Invalid Gemini response');
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
    const { generateQuizFromMaterial } = require('../services/aiService');
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

module.exports = {
  generateQuiz,
  scoreQuiz,
  handleGenerateQuizFromMaterial
};