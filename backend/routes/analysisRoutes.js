/**
 * Analysis Routes
 * Defines analysis-related routes
 */

import express from "express";
import {
  saveAnalysis,
  getAnalyses,
  getAnalysisById,
  updateAnalysis,
  updateLastActiveHandler,
  saveOnboardingGoalHandler
} from "../controllers/analysisController.js";
import { clerkAuth } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
