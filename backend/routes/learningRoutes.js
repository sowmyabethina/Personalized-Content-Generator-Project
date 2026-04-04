/**
 * Learning Routes
 * Defines learning-related routes
 */

const express = require('express');
const router = express.Router();
const {
  generatePersonalizedContentHandler,
  generateCombinedContentHandler,
  generateLearningMaterialHandler,
  generateLearningQuestions,
  evaluateLearningStyle
} = require('../controllers/learningController');
const { downloadPdf } = require('../controllers/pdfController');

// Auth middleware
const clerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.userId = req.headers['x-user-id'] || 'anonymous';
    return next();
  }
  
  if (authHeader.startsWith('Bearer ')) {
    req.userId = req.headers['x-user-id'] || 'authenticated_user';
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

// POST /learning/generate-personalized-content - Generate personalized content
router.post('/generate-personalized-content', clerkAuth, generatePersonalizedContentHandler);

// POST /learning/generate-combined-content - Generate combined content
router.post('/generate-combined-content', clerkAuth, generateCombinedContentHandler);

// POST /learning/generate-learning-material - Generate learning material
router.post('/generate-learning-material', clerkAuth, generateLearningMaterialHandler);

// POST /learning/generate-learning-questions - Generate learning questions
router.post('/generate-learning-questions', clerkAuth, generateLearningQuestions);

// POST /learning/evaluate-learning-style - Evaluate learning style
router.post('/evaluate-learning-style', clerkAuth, evaluateLearningStyle);

// POST /learning/download-pdf - Download learning material as PDF
router.post('/download-pdf', clerkAuth, downloadPdf);

module.exports = router;