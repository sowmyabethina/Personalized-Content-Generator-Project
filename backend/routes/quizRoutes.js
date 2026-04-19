/**
 * Quiz Routes
 * Defines quiz-related routes
 */

import express from "express";
import { generateQuiz, scoreQuiz, handleGenerateQuizFromMaterial } from "../controllers/quizController.js";
import { clerkAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /quiz/generate - Generate quiz from text or topic
router.post('/generate', clerkAuth, generateQuiz);

// POST /quiz/score-quiz - Score quiz answers
router.post('/score-quiz', clerkAuth, scoreQuiz);

// POST /quiz/generate-quiz-from-material - Generate quiz from learning material
router.post('/generate-quiz-from-material', clerkAuth, handleGenerateQuizFromMaterial);

export default router;
