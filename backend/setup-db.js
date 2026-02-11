import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  console.log('🚀 Setting up database tables...');
  
  try {
    // Create quizzes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(100) PRIMARY KEY,
        topic VARCHAR(255),
        source_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Created/verified: quizzes table');

    // Create quiz_questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question_index INTEGER NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Created/verified: quiz_questions table');

    // Create quiz_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_answers JSONB NOT NULL,
        score VARCHAR(20),
        correct_count INTEGER,
        total_count INTEGER,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Created/verified: quiz_results table');

    // Create user_analyses table
    await pool.query(`
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
    console.log('✅ Created/verified: user_analyses table');

    // Add missing columns for learner assessment (safe migration)
    await pool.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS topic TEXT`);
    await pool.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS learning_score INTEGER`);
    await pool.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS technical_score INTEGER`);
    await pool.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS psychometric_profile JSONB`);
    console.log('✅ Added/verified: learner assessment columns');

    // Create indexes for better query performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at)`);
    console.log('✅ Created/verified: indexes');

    console.log('\n🎉 Database setup complete!');
    console.log('Tables created: quizzes, quiz_questions, quiz_results, user_analyses');
    
    // Show current table counts
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM quizzes) as quizzes,
        (SELECT COUNT(*) FROM quiz_questions) as quiz_questions,
        (SELECT COUNT(*) FROM quiz_results) as quiz_results,
        (SELECT COUNT(*) FROM user_analyses) as user_analyses
    `);
    
    console.log('\n📊 Current table counts:');
    console.log(`  - quizzes: ${counts.rows[0].quizzes}`);
    console.log(`  - quiz_questions: ${counts.rows[0].quiz_questions}`);
    console.log(`  - quiz_results: ${counts.rows[0].quiz_results}`);
    console.log(`  - user_analyses: ${counts.rows[0].user_analyses}`);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
