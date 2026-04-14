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

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import fs from "fs";
import githubRoutes from "./routes/githubRoutes.js";

// Import configuration
import {
  initDatabase,
  verifyDatabaseConnection,
  appConfig,
  getCorsAllowedOrigins,
} from "./config/index.js";

// Import error handling middleware
import { errorMiddleware, notFoundMiddleware } from "./utils/errorHandler.js";
import { log } from "./utils/logger.js";

// Import routes
import quizRoutes from "./routes/quizRoutes.js";
import apiQuizRoutes from "./routes/apiQuizRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

// ==================== VALIDATION ====================

// Validate required environment variables
function validateEnv() {
  const errors = [];
  
  if (!process.env.DB_USER && !process.env.DATABASE_URL) {
    errors.push('DB_USER or DATABASE_URL is required');
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors);
  }
}

// ==================== APP SETUP ====================

const app = express();
const PORT = appConfig.port;
const allowedOrigins = getCorsAllowedOrigins();

// ==================== MIDDLEWARE ====================

// CORS — allowed origins from env (see backend/.env.example)
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
const uploadsDir = appConfig.uploadsDir;
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
app.use('/api/quiz', apiQuizRoutes);

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
  
  // Verify and initialize database before accepting traffic
  await verifyDatabaseConnection();
  await initDatabase();
  
  // Load agent routes
  const { default: agentRoutes } = await import('./agents/routes.js');
  app.use('/agent', agentRoutes);
  
  // Mount error handlers LAST
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  
  // Start server
  app.listen(PORT, () => {
    log(`Server listening on port ${PORT}`);
  });
}

app.use("/api/github", githubRoutes);

startServer().catch((error) => {
  log(`Server startup failed: ${error.message}`, { type: "error" });
  process.exit(1);
});

export default app;
