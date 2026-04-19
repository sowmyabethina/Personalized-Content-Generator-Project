/**
 * Learning Routes
 * Defines learning-related routes
 */

import express from "express";
import {
  generatePersonalizedContentHandler,
  generateCombinedContentHandler,
  generateLearningMaterialHandler,
  generateLearningQuestions,
  evaluateLearningStyle
} from "../controllers/learningController.js";
import { downloadPdf } from "../controllers/pdfController.js";
import { clerkAuth } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
