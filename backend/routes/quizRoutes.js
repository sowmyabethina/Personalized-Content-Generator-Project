/**
 * Quiz Routes
 * Defines quiz-related routes
 */

const express = require('express');
const router = express.Router();
const { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial } = require('../controllers/quizController');

// Auth middleware
const clerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Allow requests without auth for development
  if (!authHeader) {
    req.userId = req.headers['x-user-id'] || 'anonymous';
    return next();
  }
  
  // Basic validation
  if (authHeader.startsWith('Bearer ')) {
    req.userId = req.headers['x-user-id'] || 'authenticated_user';
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

// POST /quiz/generate - Generate quiz from text or topic
router.post('/generate', clerkAuth, generateQuiz);

// POST /quiz/score-quiz - Score quiz answers
router.post('/score-quiz', clerkAuth, scoreQuiz);

// POST /quiz/generate-quiz-from-material - Generate quiz from learning material
router.post('/generate-quiz-from-material', clerkAuth, handleGenerateQuizFromMaterial);

module.exports = router;