/**
 * Configuration Constants
 * Ports, URLs, timeouts, and service configurations
 * All values can be overridden via environment variables
 */

// ============================================
// PORT NUMBERS
// ============================================
export const PORTS = {
  BACKEND_DEFAULT: parseInt(process.env.PORT, 10) || 5000,
  RAG_SERVICE_DEFAULT: parseInt(process.env.RAG_PORT, 10) || 5001,
  POSTGRES_DEFAULT: parseInt(process.env.DB_PORT, 10) || 5432,
};

// ============================================
// DATABASE CONFIGURATION
// ============================================
export const DATABASE = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  NAME: process.env.DB_NAME || 'rag_pdf_db',
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  CONNECTION_URL: process.env.DATABASE_URL,
};

// ============================================
// SERVICE URLs
// ============================================
export const SERVICE_URLS = {
  // Backend URL (used by other services to call back)
  BACKEND: process.env.BACKEND_URL || process.env.PUBLIC_API_URL || 'http://localhost:5000',
  
  // RAG/PDF Service
  RAG_SERVICE: process.env.RAG_SERVICE_URL || 'http://localhost:5001',
  
  // RPC Service (CRITICAL - previously hardcoded)
  RPC_SERVICE: process.env.RPC_SERVICE_URL || 'http://localhost:3333',
};

// ============================================
// CORS CONFIGURATION
// ============================================
export const CORS = {
  ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean),
};

// ============================================
// TIMEOUT CONSTANTS (milliseconds)
// ============================================
export const TIMEOUTS = {
  API_STANDARD: parseInt(process.env.TIMEOUT_API_STANDARD, 10) || 5000,
  RAG_OPERATION: parseInt(process.env.TIMEOUT_RAG_OPERATION, 10) || 90000,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY, 10) || 1000,
  RATE_LIMIT_WAIT: parseInt(process.env.RATE_LIMIT_WAIT, 10) || 3000,
};

// ============================================
// CACHING CONFIGURATION
// ============================================
export const CACHE = {
  RAG_RESPONSE_TTL: parseInt(process.env.CACHE_RAG_TTL, 10) || 5 * 60 * 1000, // 5 minutes
  PDF_CHAT_TTL: parseInt(process.env.CACHE_PDF_TTL, 10) || 20000, // 20 seconds
  CLEANUP_INTERVAL: parseInt(process.env.CACHE_CLEANUP_INTERVAL, 10) || 60000, // 1 minute
  MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE, 10) || 100,
};

// ============================================
// FEATURE FLAGS
// ============================================
export const FEATURES = {
  USE_GROQ: process.env.FEATURE_USE_GROQ !== 'false',
  USE_OPENAI: process.env.FEATURE_USE_OPENAI !== 'false',
  ENABLE_RAG_CACHE: process.env.FEATURE_RAG_CACHE !== 'false',
  ENABLE_PDF_MINDMAP: process.env.FEATURE_PDF_MINDMAP !== 'false',
};

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
export const UPLOADS = {
  DIR: process.env.UPLOADS_DIR || './uploads',
  MAX_SIZE: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 50 * 1024 * 1024, // 50MB
};

// ============================================
// VALIDATION LIMITS
// ============================================
export const LIMITS = {
  MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 2000,
  DEFAULT_LESSON_COUNT: parseInt(process.env.DEFAULT_LESSON_COUNT, 10) || 5,
  LESSONS_MIN: 3,
  LESSONS_MAX: 12,
};

// ============================================
// API CONFIGURATION
// ============================================
export const API = {
  LOG_REQUESTS: process.env.LOG_REQUESTS !== 'false',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default {
  PORTS,
  DATABASE,
  SERVICE_URLS,
  CORS,
  TIMEOUTS,
  CACHE,
  FEATURES,
  UPLOADS,
  LIMITS,
  API,
};
