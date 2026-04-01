/**
 * Analysis Routes
 * Defines analysis-related routes
 */

const express = require('express');
const router = express.Router();
const {
  saveAnalysis,
  getAnalyses,
  getAnalysisById,
  updateAnalysis,
  updateLastActiveHandler,
  saveOnboardingGoalHandler
} = require('../controllers/analysisController');

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

// POST /save-analysis - Save user analysis
router.post('/save-analysis', clerkAuth, saveAnalysis);

// GET /analyses - Get all analyses
router.get('/analyses', clerkAuth, getAnalyses);

// GET /analysis/:id - Get analysis by ID
router.get('/analysis/:id', clerkAuth, getAnalysisById);

// PUT /analysis/:id - Update analysis
router.put('/analysis/:id', clerkAuth, updateAnalysis);

// PATCH /analysis/:id/last-active - Update last active timestamp
router.patch('/analysis/:id/last-active', clerkAuth, updateLastActiveHandler);

// POST /onboarding/goal - Save onboarding goal
router.post('/onboarding/goal', clerkAuth, saveOnboardingGoalHandler);

module.exports = router;