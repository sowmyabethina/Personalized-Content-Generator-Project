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

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Import configuration
const { initDatabase } = require('./config/database');

// Import error handling middleware
const { errorMiddleware, notFoundMiddleware } = require('./utils/errorHandler');
const { log } = require('./utils/logger');

// Import routes
const quizRoutes = require('./routes/quizRoutes');
const learningRoutes = require('./routes/learningRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

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
app.use(cors({
  origin: CORS_ORIGIN,
  exposedHeaders: ['X-Quiz-Id']
}));

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

startServer();

module.exports = app;
