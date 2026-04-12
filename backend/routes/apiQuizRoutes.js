/**
 * API-prefixed quiz routes (frontend expects /api/quiz/score for submitQuiz).
 */

import express from "express";
import { processQuizScore } from "../controllers/quizController.js";

const router = express.Router();

const clerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.userId = req.headers["x-user-id"] || "anonymous";
    return next();
  }

  if (authHeader.startsWith("Bearer ")) {
    req.userId = req.headers["x-user-id"] || "authenticated_user";
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
};

router.post("/score", clerkAuth, processQuizScore);

export default router;
