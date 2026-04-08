/**
 * Backend Entry Point - Modular Express Application
 * 
 * ============================================
 * CRITICAL: This file should ONLY contain:
 * - Express app initialization
 * - Global middleware (cors, json)
 * - Route imports and mounting
 * - Server startup
 * 
 * NO business logic should be here!
 * ============================================
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import githubRoutes from "./routes/githubRoutes.js";

// Import configuration
import { initDatabase } from "./config/database.js";

// Import error handling middleware
import { errorMiddleware, notFoundMiddleware } from "./utils/errorHandler.js";
import { log } from "./utils/logger.js";

// Import routes
import quizRoutes from "./routes/quizRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";

// ==================== VALIDATION ====================

// Validate required environment variables
function validateEnv() {
  const errors = [];
  
  if (!process.env.DB_USER && !process.env.DATABASE_URL) {
    errors.push('DB_USER or DATABASE_URL is required');
  }
  
  if (!process.env.GEMINI_API_KEY) {
    log('Warning: GEMINI_API_KEY not set - AI features will be disabled', { type: 'warn' });
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors);
  }
}

// ==================== APP SETUP ====================

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ==================== MIDDLEWARE ====================

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// JSON parsing
app.use(express.json());

// Create uploads directory if needed
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check (no logic)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ROUTE MOUNTING ====================

// Quiz routes
app.use('/quiz', quizRoutes);

// Learning routes
app.use('/learning', learningRoutes);

// PDF routes
app.use('/pdf', pdfRoutes);

// Analysis routes (at root level)
app.use('/', analysisRoutes);

// ==================== SERVER STARTUP ====================

async function startServer() {
  // Validate environment
  validateEnv();
  
  // Initialize database
  initDatabase();
  
  // Load agent routes
  const { default: agentRoutes } = await import('./agents/routes.js');
  app.use('/agent', agentRoutes);
  
  // Mount error handlers LAST
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  
  // Start server
  app.listen(PORT, () => {
    log(`Server started on http://localhost:${PORT}`);
  });
}

app.use("/api/github", githubRoutes);

startServer();

export default app;
