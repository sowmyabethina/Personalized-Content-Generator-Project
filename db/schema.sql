CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    pdf_id VARCHAR(100) NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding JSONB NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster PDF lookups
CREATE INDEX IF NOT EXISTS idx_document_chunks_pdf_id ON document_chunks(pdf_id);

-- Create index on embedding for faster similarity search (using GIN index on JSONB)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING GIN (embedding);

-- Optional: Create a table for tracking uploaded PDFs
CREATE TABLE IF NOT EXISTS uploaded_pdfs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'processed',
    chunk_count INTEGER DEFAULT 0
);

-- Index for PDF tracking
CREATE INDEX IF NOT EXISTS idx_uploaded_pdfs_status ON uploaded_pdfs(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.upload_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating timestamp (optional)
-- DROP TRIGGER IF EXISTS update_uploaded_pdfs_updated_at ON uploaded_pdfs;
-- CREATE TRIGGER update_uploaded_pdfs_updated_at
--     BEFORE UPDATE ON uploaded_pdfs
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- Grant all permissions (adjust as needed for production)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- ===============================
-- QUIZ TABLES FOR PERSISTENT STORAGE
-- ===============================

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id VARCHAR(100) PRIMARY KEY,
    topic VARCHAR(255),
    source_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(100) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_answers JSONB NOT NULL,
    score VARCHAR(20),
    correct_count INTEGER,
    total_count INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quiz tables
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at);

-- ===============================
-- USER ANALYSIS TABLES FOR PERSISTENT STORAGE
-- ===============================

-- User analyses table to store profile analysis results
CREATE TABLE IF NOT EXISTS user_analyses (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    source_type VARCHAR(50) NOT NULL DEFAULT 'resume',
    source_url TEXT,
    
    -- Analysis results
    extracted_text TEXT,
    skills JSONB,
    strengths JSONB,
    weak_areas JSONB,
    ai_recommendations JSONB,
    learning_roadmap JSONB,
    
    -- Metadata
    technical_level VARCHAR(50),
    learning_style VARCHAR(50),
    overall_score INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analysis tables
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analyses_source_type ON user_analyses(source_type);
