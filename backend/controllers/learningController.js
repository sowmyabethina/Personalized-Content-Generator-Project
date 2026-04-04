/**
 * Learning Controller
 * Handles learning route logic (req/res handling)
 * 
 * MUST be thin - ONLY receives req/res, calls services, returns response
 */

const { 
  generateLearningMaterial,
  generatePersonalizedContent, 
  generateCombinedContent 
} = require('../services/aiService');
const { handleError } = require('../utils/errorHandler');
const { log } = require('../utils/logger');

/**
 * Generate personalized content - handles /learning/generate-personalized-content
 * Expects: { topic, styleId?, technicalLevel?, learningStyle? }
 */
async function generatePersonalizedContentHandler(req, res) {
  try {
    const { topic, styleId, technicalLevel, learningStyle } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    const content = await generatePersonalizedContent(topic, learningStyle || styleId, technicalLevel);
    return res.json(content);

  } catch (err) {
    const errorResponse = handleError(err, '/learning/generate-personalized-content');
    return res.status(500).json({ error: 'Content generation failed', details: errorResponse.message });
  }
}

/**
 * Generate combined content - handles /learning/generate-combined-content
 * Expects: { topic, technicalLevel?, technicalScore?, learningStyle?, learningScore?, combinedAnalysis? }
 */
async function generateCombinedContentHandler(req, res) {
  try {
    const { topic, technicalLevel, technicalScore, learningStyle, learningScore, combinedAnalysis } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    const content = await generateCombinedContent(
      topic, 
      technicalLevel, 
      technicalScore, 
      learningStyle, 
      learningScore, 
      combinedAnalysis
    );
    return res.json(content);

  } catch (err) {
    const errorResponse = handleError(err, '/learning/generate-combined-content');
    return res.status(500).json({ error: 'Combined content generation failed', details: errorResponse.message });
  }
}

/**
 * Generate learning material - handles /learning/generate-learning-material
 * Expects: { topic, technicalLevel?, learningStyle? }
 */
async function generateLearningMaterialHandler(req, res) {
  try {
    const { topic, technicalLevel, learningStyle } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    const material = await generateLearningMaterial(topic, technicalLevel, learningStyle);
    return res.json(material);

  } catch (err) {
    const errorResponse = handleError(err, '/learning/generate-learning-material');
    return res.status(500).json({ error: 'Learning material generation failed', details: errorResponse.message });
  }
}

/**
 * Generate learning questions - handles /learning/generate-learning-questions
 */
async function generateLearningQuestions(req, res) {
  try {
    const questions = [
      { id: 1, question: 'How would you describe your familiarity with learning new technical concepts?', options: ['I am new and need step-by-step guidance', 'I have some experience and can learn with moderate help', 'I am comfortable learning challenging concepts independently'], answer: 'I have some experience and can learn with moderate help', category: 'technical_familiarity' },
      { id: 2, question: 'How comfortable are you reading technical documentation?', options: ['I prefer simple tutorials instead', 'I can understand documentation with some help', 'I regularly learn directly from documentation'], answer: 'I can understand documentation with some help', category: 'documentation_skill' },
      { id: 3, question: 'When learning a new topic, what is your usual learning goal?', options: ['Understand the basics only', 'Build working applications', 'Master advanced concepts and optimizations'], answer: 'Build working applications', category: 'learning_goal' },
      { id: 4, question: 'How confident are you in applying what you learned to a real project?', options: ['I need detailed instructions', 'I can implement with some guidance', 'I can design and implement independently'], answer: 'I can implement with some guidance', category: 'application_confidence' },
      { id: 5, question: 'When learning a difficult concept, what do you usually do?', options: ['Wait for a simpler explanation', 'Practice until I understand', 'Research deeply from multiple resources'], answer: 'Practice until I understand', category: 'learning_behavior' }
    ];

    return res.json(questions);

  } catch (err) {
    const errorResponse = handleError(err, '/learning/generate-learning-questions');
    return res.status(500).json({ error: 'Learning questions generation failed', details: errorResponse.message });
  }
}

/**
 * Evaluate learning style - handles /learning/evaluate-learning-style
 * Expects: { answers: [], topic? }
 * 
 * NOTE: This controller has some logic by design - it's evaluation logic specific to this endpoint
 */
async function evaluateLearningStyle(req, res) {
  try {
    const { answers, topic } = req.body;

    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({ error: 'Expected 5 answers' });
    }

    // Calculate scores based on answers
    const categories = ['technicalFamiliarity', 'documentationSkill', 'learningGoal', 'applicationConfidence', 'learningBehavior'];
    const scoreMap = {
      'I am new and need step-by-step guidance': 0,
      'I have some experience and can learn with moderate help': 1,
      'I am comfortable learning challenging concepts independently': 2,
      'I prefer simple tutorials instead': 0,
      'I can understand documentation with some help': 1,
      'I regularly learn directly from documentation': 2,
      'Understand the basics only': 0,
      'Build working applications': 1,
      'Master advanced concepts and optimizations': 2,
      'I need detailed instructions': 0,
      'I can implement with some guidance': 1,
      'I can design and implement independently': 2,
      'Wait for a simpler explanation': 0,
      'Practice until I understand': 1,
      'Research deeply from multiple resources': 2
    };

    const scores = {};
    categories.forEach((category, idx) => {
      scores[category] = scoreMap[answers[idx]] || 0;
    });

    // Calculate scores
    const technicalScore = scores.technicalFamiliarity + scores.documentationSkill;
    const learningScore = scores.learningGoal + scores.applicationConfidence + scores.learningBehavior;
    const totalScore = technicalScore + learningScore;
    const percentage = Math.round((totalScore / 10) * 100);

    // Determine level
    let learnerLevel = 'Beginner';
    if (totalScore >= 8) learnerLevel = 'Advanced';
    else if (totalScore >= 4) learnerLevel = 'Intermediate';

    // Build level map
    const levels = {};
    Object.entries(scores).forEach(([key, score]) => {
      if (score === 0) levels[key] = 'Beginner';
      else if (score === 1) levels[key] = 'Intermediate';
      else levels[key] = 'Advanced';
    });

    const styleId = `style_${Date.now()}`;

    log(`Learner level evaluated for topic ${topic}: ${learnerLevel} (${percentage}%)`);

    return res.json({
      success: true,
      styleId,
      learnerLevel,
      score: percentage,
      technicalScore,
      learningScore,
      profile: { levels, scores }
    });

  } catch (err) {
    const errorResponse = handleError(err, '/learning/evaluate-learning-style');
    return res.status(500).json({ error: 'Learning style evaluation failed', details: errorResponse.message });
  }
}

module.exports = {
  generatePersonalizedContentHandler,
  generateCombinedContentHandler,
  generateLearningMaterialHandler,
  generateLearningQuestions,
  evaluateLearningStyle
};