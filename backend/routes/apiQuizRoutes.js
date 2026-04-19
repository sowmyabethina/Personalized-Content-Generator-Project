/**
 * API-prefixed quiz routes (frontend expects /api/quiz/score for submitQuiz).
 */

import express from "express";
import { processQuizScore } from "../controllers/quizController.js";
import { clerkAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/score", clerkAuth, processQuizScore);

export default router;
