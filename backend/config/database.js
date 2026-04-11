/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

import "dotenv/config";
import pg from "pg";
import { log } from "../utils/logger.js";

const { Pool } = pg;

// Validate that database config exists
function validateDbConfig() {
  const hasUser = !!process.env.DB_USER;
  const hasUrl = !!process.env.DATABASE_URL;
  
  if (!hasUser && !hasUrl) {
    throw new Error('Database configuration missing: set DB_USER or DATABASE_URL env var');
  }
}

// Initialize pool
validateDbConfig();

const pool = new Pool({
  user: process.env.DB_USER || undefined,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD || undefined,
  port: process.env.DB_PORT || 5432,
  ...(process.env.DATABASE_URL && { connectionString: process.env.DATABASE_URL })
});

pool.on('connect', () => {
  log('Database connected');
});

pool.on('error', (err) => {
  log(`Database error: ${err.message}`, { type: 'error' });
});

// Database wrapper
const db = {
  query: (text, params) => pool.query(text, params),
  pool,
  close: () => pool.end()
};

/**
 * Initialize database tables
 */
async function initDatabase() {
  try {
    // Create quizzes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(100) PRIMARY KEY,
        topic VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    // Create quiz_questions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question_index INTEGER NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT
      )
    `);
    
    // Create quiz_results table
    await db.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_answers JSONB NOT NULL,
        score INTEGER,
        correct_count INTEGER,
        total_count INTEGER,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create user_analyses table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_analyses (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        source_type VARCHAR(50) NOT NULL DEFAULT 'resume',
        source_url TEXT,
        extracted_text TEXT,
        skills JSONB,
        strengths JSONB,
        weak_areas JSONB,
        ai_recommendations JSONB,
        learning_roadmap JSONB,
        technical_level VARCHAR(50),
        learning_style VARCHAR(50),
        overall_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Safe migrations
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS topic TEXT`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS learning_score INTEGER`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS technical_score INTEGER`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS psychometric_profile JSONB`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS career_goal VARCHAR(100)`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS goal VARCHAR(100)`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50)`);
    
    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at)`);
    
    log('Database tables initialized');
  } catch (error) {
    log(`Database init error: ${error.message}`, { type: 'error' });
  }
}

export { db, initDatabase };
export default { db, initDatabase };
