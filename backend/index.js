/**
 * Backend Entry Point - Monolithic Express Application
 * All routes and logic consolidated into single file
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pg = require('pg');

const { Pool } = pg;

// ==================== DATABASE SETUP ====================
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
  close: () => pool.end()
};

// ==================== DATABASE INITIALIZATION ====================
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
    
    // Add missing columns for learner assessment (safe migration)
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS topic TEXT`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS learning_score INTEGER`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS technical_score INTEGER`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS psychometric_profile JSONB`);
    
    // Add onboarding columns
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS career_goal VARCHAR(100)`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS goal VARCHAR(100)`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE user_analyses ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50)`);
    
    // Create indexes for user_analyses
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at)`);
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
}

// ==================== MIDDLEWARE ====================
const clerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Allow requests without auth for development
  // In production, require valid Clerk token
  if (!authHeader) {
    // For development: allowId from header if requests, extract user present
    req.userId = req.headers['x-user-id'] || 'anonymous';
    return next();
  }
  
  // Basic validation - in production use Clerk's verifyToken
  if (authHeader.startsWith('Bearer ')) {
    req.userId = req.headers['x-user-id'] || 'authenticated_user';
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

// ==================== GEMINI SERVICE ====================
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

async function generateQuizQuestions(text, options = {}) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = buildQuizPrompt(text, options);
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output');
  }

  // Clean up response
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  return JSON.parse(jsonStr.trim());
}

function buildQuizPrompt(text, options = {}) {
  const { topic, difficulty = 'intermediate', technicalLevel } = options;
  
  // Check if text is a topic or actual content
  const isTopic = text.trim().length < 200;
  
  if (isTopic) {
    return `Generate comprehensive skill-testing quiz questions on topic: ${text}. 

Target difficulty level: ${technicalLevel || difficulty}.

The questions should test practical understanding and application of concepts related to ${text}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${technicalLevel || difficulty} level learner should know about ${text}.`;
  }
  
  // Text is actual content - generate from it
  return `Convert this content into skill-testing multiple choice questions:

${text}

Generate 10 questions that test understanding and application, not just recall.`;
}

async function generateLearningMaterial(topic, technicalLevel, learningStyle) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert technical educator. Generate comprehensive, structured learning material for the following:

Topic: ${topic}
Technical Level: ${technicalLevel}
Learning Style: ${learningStyle}

Create detailed learning material with the following structure in JSON format:

{
  "title": "Complete ${topic} Learning Guide",
  "topic": "${topic}",
  "level": "${technicalLevel}",
  "style": "${learningStyle}",
  "summary": "A comprehensive overview tailored for ${learningStyle} learners at ${technicalLevel} level",
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed paragraph(s) explaining the concept with real-world applications and context (2-3 paragraphs)",
      "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "examples": [
        {
          "title": "Example Title",
          "description": "Detailed description of what this example demonstrates",
          "code": "Code snippet or practical example"
        }
      ],
      "applications": ["Real-world application 1", "Real-world application 2"],
      "practiceQuestions": ["Question 1", "Question 2", "Question 3"],
      "estimatedTime": "20 minutes"
    }
  ],
  "finalProject": {
    "title": "Capstone Project: [Project Name]",
    "description": "A comprehensive project that combines all concepts learned",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "expectedOutcome": "What learners will achieve after completing this project"
  },
  "cheatsheet": {
    "commands": ["Command 1", "Command 2", "Command 3"],
    "definitions": {
      "Term 1": "Definition",
      "Term 2": "Definition"
    }
  },
  "furtherReading": ["Resource 1", "Resource 2", "Resource 3"],
  "learningTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Requirements:
- Generate 4-5 comprehensive sections covering different aspects of ${topic}
- Each section should have detailed explanations with practical applications
- Include code examples where applicable
- Provide multiple key points and practice questions per section
- The content should be suitable for a ${learningStyle} learner at ${technicalLevel} level
- Include real-world scenarios and use cases
- Make it engaging and practical

Return ONLY valid JSON, no additional text.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for learning material');
  }

  // Parse JSON response
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  return JSON.parse(jsonStr.trim());
}

async function generateQuizFromMaterial(topic, material, technicalLevel, learningStyle) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const materialSummary = material.sections
    ?.map(s => `${s.title}: ${s.content}`)
    .join('\n\n') || material.summary || '';

  const prompt = `Based on this learning material about ${topic}, generate 10 comprehensive multiple-choice questions that test SKILLS and APPLICATION of knowledge suitable for a ${technicalLevel || 'intermediate'} level learner:

Learning Material Content:
${materialSummary}

IMPORTANT: The questions should be tailored to ${technicalLevel || 'intermediate'} level knowledge.

GENERATE SKILL-BASED QUESTIONS, NOT EXTRACTIVE QUESTIONS:

❌ BAD (Extractive - just asks what was mentioned):
- "Which JavaScript library is mentioned in the document?"
- "What is the name of the project described?"

✅ GOOD (Skill-based - tests understanding and application):
- "When building a web application, which library would you choose for state management and why?"
- "Given a scenario where you need to handle async data fetching, which approach would be most appropriate?"

RULES:
1. Questions should test PROBLEM-SOLVING ability, not memory recall
2. Include practical SCENARIOS and USE CASES
3. Ask "what would you do if..." or "how would you..." type questions
4. Test understanding of WHEN to use different approaches
5. Include questions about TRADE-OFFS and DECISIONS

EXPLANATION RULES:
1. NEVER say "The correct answer is" or quote the answer text
2. ALWAYS explain the CONCEPT purely (what it is, how it works)
3. ALWAYS explain WHY the correct option works (the technical reasoning)
4. Keep to exactly 2 sentences

Return ONLY valid JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "[Explain the concept]. [Explain why this works]."
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini output for quiz');
  }

  return JSON.parse(rawText);
}

// ==================== PDF SERVICE ====================
const pdf = require('pdf-parse');

/**
 * Extract GitHub repository URLs from text
 * @param {string} text - Text to search for GitHub URLs
 * @returns {Array<string>} - Array of GitHub repository URLs
 */
function extractGitHubUrls(text) {
  if (!text) return [];
  
  // Simpler and more effective regex patterns for GitHub URLs
  const githubPatterns = [
    // Match github.com/username/repo (with or without https)
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi,
    // Match raw.githubusercontent.com URLs
    /(?:https?:\/\/)?raw\.githubusercontent\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi,
    // Match gist.github.com URLs
    /(?:https?:\/\/)?gist\.github\.com\/[a-zA-Z0-9_-]+/gi
  ];
  
  const urls = new Set();
  
  for (const pattern of githubPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the URL
        let cleanUrl = match;
        
        // Remove tree/branch references
        cleanUrl = cleanUrl.replace(/\/tree\/[a-zA-Z0-9_-]+/gi, '');
        cleanUrl = cleanUrl.replace(/\/blob\/[a-zA-Z0-9_-]+/gi, '');
        cleanUrl = cleanUrl.replace(/\/raw\/[a-zA-Z0-9_-]+/gi, '');
        
        // Ensure it starts with https
        if (!cleanUrl.startsWith('http')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        
        // Remove trailing slashes and fragments
        cleanUrl = cleanUrl.split('/').filter((part, i, arr) => {
          // Keep all parts except empty trailing parts
          return !(i === arr.length - 1 && (part === '' || part.startsWith('#')));
        }).join('/');
        
        // Only add if it looks like a valid repo URL
        if (cleanUrl.includes('github.com/') && !cleanUrl.includes('/issues') && !cleanUrl.includes('/pull') && !cleanUrl.includes('/actions')) {
          urls.add(cleanUrl);
        }
      });
    }
  }
  
  return Array.from(urls);
}

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  
  if (!data.text || data.text.trim().length < 50) {
    throw new Error('Could not extract text from PDF');
  }
  
  return data.text;
}

function filterTechnicalContent(text) {
  const lines = text.split('\n');
  const technicalLines = [];
  
  // Categories to keep (technical content)
  const technicalKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'scala', 'r',
    // Web technologies
    'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'jquery', 'ajax',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'firebase',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'terraform',
    // Data Science & ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit', 'nlp', 'computer vision',
    // Frameworks & Libraries
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum', 'tdd', 'testing',
    // Other technical terms
    'algorithm', 'data structure', 'api', 'backend', 'frontend', 'fullstack', 'debugging', 'optimization'
  ];
  
  // Personal info to remove
  const personalInfoPatterns = [
    /^email:\s*/i,
    /^phone:\s*/i,
    /^address:\s*/i,
    /^linkedin:\s*/i,
    /^github:\s*/i,
    /^portfolio:\s*/i,
    /^website:\s*/i,
    /^dob:\s*/i,
    /^date of birth/i,
    /^gender:\s*/i,
    /^marital status/i,
    /^nationality/i,
    /^visa status/i
  ];
  
  // Section headers to keep
  const sectionHeaders = [
    /experience/i,
    /education/i,
    /skills/i,
    /projects/i,
    /certifications/i,
    /publications/i,
    /awards/i,
    /technical/i
  ];
  
  let inTechnicalSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Skip personal information
    let skipLine = false;
    for (const pattern of personalInfoPatterns) {
      if (pattern.test(trimmed)) {
        skipLine = true;
        break;
      }
    }
    if (skipLine) continue;
    
    // Check if this is a section header
    if (sectionHeaders.some(h => h.test(trimmed))) {
      inTechnicalSection = /experience|education|skills|projects|certifications|technical/i.test(trimmed);
      technicalLines.push(trimmed);
      continue;
    }
    
    // Check if line contains technical content
    const lowerLine = trimmed.toLowerCase();
    const hasTechnical = technicalKeywords.some(kw => lowerLine.includes(kw));
    
    // Keep lines in technical sections or with technical keywords
    if (inTechnicalSection || hasTechnical || trimmed.length > 50) {
      technicalLines.push(trimmed);
    }
  }
  
  return technicalLines.join('\n\n');
}

async function processResumePdf(filePath) {
  const stats = fs.statSync(filePath);
  
  if (stats.size < 100) {
    fs.unlinkSync(filePath);
    throw new Error('PDF file is too small or empty');
  }

  // Extract text from PDF
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  if (!data.text || data.text.trim().length < 50) {
    fs.unlinkSync(filePath);
    throw new Error('Could not extract text from PDF');
  }

  // Clean up uploaded file
  fs.unlinkSync(filePath);

  // Filter technical content from resume
  const technicalText = filterTechnicalContent(data.text);

  if (technicalText.length < 100) {
    throw new Error('Not enough technical content to generate questions. Resume appears to lack technical skills, experience, or projects.');
  }

  return {
    text: technicalText,
    fullText: data.text,
    pageCount: data.numpages
  };
}

// ==================== QUIZ SERVICE ====================
async function storeQuiz(quizId, quizData, topic) {
  try {
    await db.query(
      `INSERT INTO quizzes (id, topic, created_at, expires_at) 
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours') 
       ON CONFLICT (id) DO NOTHING`,
      [quizId, topic || 'Quiz']
    );

    for (const q of quizData) {
      await db.query(
        `INSERT INTO quiz_questions (quiz_id, question_index, question, options, correct_answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quizId, q.originalIndex, q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation || null]
      );
    }

    console.log('✅ Quiz stored in database:', quizId);
    return true;
  } catch (err) {
    console.error('❌ Error storing quiz in database:', err.message);
    return false;
  }
}

async function getQuiz(quizId) {
  try {
    const result = await db.query(
      `SELECT q.id, q.topic, q.created_at,
              qj.question_index, qj.question, qj.options, qj.correct_answer, qj.explanation
       FROM quizzes q
       JOIN quiz_questions qj ON q.id = qj.quiz_id
       WHERE q.id = $1
       ORDER BY qj.question_index`,
      [quizId]
    );

    if (result.rows.length === 0) return null;

    const quizData = result.rows.map(row => ({
      originalIndex: row.question_index,
      question: row.question,
      options: row.options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation
    }));

    return {
      quizData,
      totalQuestions: quizData.length
    };
  } catch (err) {
    console.error('❌ Error getting quiz from database:', err.message);
    return null;
  }
}

async function storeQuizResult(quizId, answers, score, correctCount, totalCount) {
  try {
    await db.query(
      `INSERT INTO quiz_results (quiz_id, user_answers, score, correct_count, total_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [quizId, JSON.stringify(answers), score, correctCount, totalCount]
    );
    console.log('✅ Quiz result stored:', quizId);
    return true;
  } catch (err) {
    console.error('❌ Error storing quiz result:', err.message);
    return false;
  }
}

// ==================== ANALYSIS SERVICE ====================
async function saveUserAnalysis(analysisData) {
  try {
    const {
      id,
      userId,
      sourceType,
      sourceUrl,
      extractedText,
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      overallScore
    } = analysisData;

    await db.query(
      `INSERT INTO user_analyses 
       (id, user_id, source_type, source_url, extracted_text, skills, strengths, weak_areas, 
        ai_recommendations, learning_roadmap, technical_level, learning_style, overall_score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
        extracted_text = COALESCE($5, user_analyses.extracted_text),
        skills = COALESCE($6, user_analyses.skills),
        strengths = COALESCE($7, user_analyses.strengths),
        weak_areas = COALESCE($8, user_analyses.weak_areas),
        ai_recommendations = COALESCE($9, user_analyses.ai_recommendations),
        learning_roadmap = COALESCE($10, user_analyses.learning_roadmap),
        technical_level = COALESCE($11, user_analyses.technical_level),
        learning_style = COALESCE($12, user_analyses.learning_style),
        overall_score = COALESCE($13, user_analyses.overall_score),
        updated_at = NOW()`,
      [id, userId || null, sourceType, sourceUrl || null, extractedText || null, 
       JSON.stringify(skills || []), JSON.stringify(strengths || []), JSON.stringify(weakAreas || []),
       JSON.stringify(aiRecommendations || []), JSON.stringify(learningRoadmap || null),
       technicalLevel || null, learningStyle || null, overallScore || null]
    );

    console.log('✅ User analysis saved:', id);
    return { success: true, analysisId: id };
  } catch (err) {
    console.error('❌ Error saving user analysis:', err.message);
    return { success: false, error: err.message };
  }
}

async function updateUserAnalysis(analysisId, updateData) {
  try {
    const {
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      topic,
      learningScore,
      technicalScore,
      psychometricProfile
    } = updateData;

    const result = await db.query(
      `UPDATE user_analyses SET
        skills = COALESCE($2, skills),
        strengths = COALESCE($3, strengths),
        weak_areas = COALESCE($4, weak_areas),
        ai_recommendations = COALESCE($5, ai_recommendations),
        learning_roadmap = COALESCE($6, learning_roadmap),
        technical_level = COALESCE($7, technical_level),
        learning_style = COALESCE($8, learning_style),
        topic = COALESCE($9, topic),
        learning_score = COALESCE($10, learning_score),
        technical_score = COALESCE($11, technical_score),
        psychometric_profile = COALESCE($12, psychometric_profile),
        updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [analysisId,
       JSON.stringify(skills || null),
       JSON.stringify(strengths || null),
       JSON.stringify(weakAreas || null),
       JSON.stringify(aiRecommendations || null),
       JSON.stringify(learningRoadmap || null),
       technicalLevel || null,
       learningStyle || null,
       topic || null,
       learningScore || null,
       technicalScore || null,
       JSON.stringify(psychometricProfile || null)]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Analysis not found' };
    }

    console.log('✅ User analysis updated:', analysisId);
    return { success: true, analysisId };
  } catch (err) {
    console.error('❌ Error updating user analysis:', err.message);
    return { success: false, error: err.message };
  }
}

async function getUserAnalysis(analysisId) {
  try {
    const result = await db.query(
      `SELECT id, user_id, source_type, source_url, extracted_text, skills, strengths, weak_areas,
              ai_recommendations, learning_roadmap, technical_level, learning_style, overall_score,
              topic, learning_score, technical_score, psychometric_profile,
              created_at, updated_at
       FROM user_analyses WHERE id = $1`,
      [analysisId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      extractedText: row.extracted_text,
      skills: row.skills,
      strengths: row.strengths,
      weakAreas: row.weak_areas,
      aiRecommendations: row.ai_recommendations,
      learningRoadmap: row.learning_roadmap,
      technicalLevel: row.technical_level,
      learningStyle: row.learning_style,
      overallScore: row.overall_score,
      topic: row.topic,
      learningScore: row.learning_score,
      technicalScore: row.technical_score,
      psychometricProfile: row.psychometric_profile,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (err) {
    console.error('❌ Error getting user analysis:', err.message);
    return null;
  }
}

async function getUserAnalyses(userId) {
  try {
    let query;
    let params;
    
    if (userId) {
      query = `SELECT id, user_id, source_type, source_url, technical_level, learning_style, overall_score,
               topic, learning_score, technical_score, psychometric_profile,
               career_goal, onboarding_completed, experience_level,
               learning_roadmap,
               created_at, updated_at
        FROM user_analyses 
        WHERE user_id = $1
        ORDER BY created_at DESC`;
      params = [userId];
    } else {
      query = `SELECT id, user_id, source_type, source_url, technical_level, learning_style, overall_score,
               topic, learning_score, technical_score, psychometric_profile,
               career_goal, onboarding_completed, experience_level,
               learning_roadmap,
               created_at, updated_at
        FROM user_analyses 
        ORDER BY created_at DESC`;
      params = [];
    }
    
    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      technicalLevel: row.technical_level,
      learningStyle: row.learning_style,
      overallScore: row.overall_score,
      topic: row.topic,
      learningScore: row.learning_score,
      technicalScore: row.technical_score,
      psychometricProfile: row.psychometric_profile,
      careerGoal: row.career_goal,
      onboardingCompleted: row.onboarding_completed,
      experienceLevel: row.experience_level,
      learningRoadmap: row.learning_roadmap,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.error('❌ Error getting user analyses:', err.message);
    return [];
  }
}

// ==================== QUESTION GENERATOR (from pdf service) ====================
// Using dynamic import for ES module
let questionGeneratorModule = null;
async function getQuestionGenerator() {
  if (!questionGeneratorModule) {
    questionGeneratorModule = await import('../pdf/questionGenerator.js');
  }
  return questionGeneratorModule;
}

async function generateQuestions(text) {
  const { generateQuestions: gen } = await getQuestionGenerator();
  return gen(text);
}

// ==================== CONTROLLERS ====================

// Quiz Controllers
async function generateQuiz(req, res) {
  try {
    const { docText, topic, difficulty, technicalLevel } = req.body;
    let text = '';

    if (docText && docText.trim().length > 100) {
      text = docText;
    } else if (topic && topic.trim()) {
      const level = technicalLevel || difficulty || 'intermediate';
      text = `Generate comprehensive skill-testing quiz questions on topic: ${topic}. 

Target difficulty level: ${level}.

The questions should test practical understanding and application of concepts related to ${topic}. 
Include scenario-based questions, concept understanding, and problem-solving. 
Do not ask about specific names or details mentioned in documents - focus on testing skills and knowledge.

Generate questions that a ${level} level learner should know about ${topic}.`;
    } else {
      return res.status(400).json({ error: 'docText or topic required' });
    }

    const questions = await generateQuestions(text);
    if (!Array.isArray(questions)) throw new Error('Invalid Gemini response');

    // Debug: Log first question's explanation
    if (questions.length > 0) {
      console.log('🔍 DEBUG - First question explanation:', questions[0].explanation);
      console.log('🔍 DEBUG - First question category:', questions[0].category);
    }

    const quizId = `quiz_${Date.now()}`;
    
    // Normalize stored answers
    const quizData = questions.map((q, idx) => {
      const ans = q.answer;
      const opts = Array.isArray(q.options) ? q.options : [];
      let normalizedAns = ans;

      // Convert letter to full text
      if (typeof ans === 'string' && /^[A-D]$/i.test(ans) && opts.length > 0) {
        const ansIdx = ans.toUpperCase().charCodeAt(0) - 65;
        normalizedAns = opts[ansIdx] || opts[0];
      }
      // Convert index to full text
      if (typeof ans === 'number' && opts.length > 0) {
        normalizedAns = opts[ans] || opts[0];
      }
      if (!ans) {
        normalizedAns = '';
      }

      return {
        originalIndex: idx,
        question: q.question,
        options: opts,
        correctAnswer: normalizedAns,
        explanation: q.explanation || '',
        category: q.category || ''
      };
    });

    // Store in database
    await storeQuiz(quizId, quizData, topic);

    console.log('✅ Quiz stored:', quizId);

    res.setHeader('X-Quiz-Id', quizId);
    // Return quizData which has the normalized correctAnswer field
    return res.json(quizData);

  } catch (err) {
    console.error('❌ /generate error:', err);
    const msg = err && err.message ? err.message : String(err);

    if (msg.toLowerCase().includes('not enough content')) {
      return res.status(400).json({ error: 'not_enough_content', message: 'Document too short for question generation.' });
    }

    if (msg.includes('Too Many Requests') || msg.toLowerCase().includes('quota')) {
      return res.status(429).json({
        error: 'rate_limit',
        message: 'External AI quota exceeded. Try again later.'
      });
    }

    return res.status(500).json({ error: 'Question generation failed', details: msg });
  }
}

async function scoreQuiz(req, res) {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quizId and answers array required' });
    }
    
    const quizData = await getQuiz(quizId);
    
    if (!quizData) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const { quizData: storedQuiz, totalQuestions } = quizData;
    
    let correct = 0;
    const results = answers.map((userAnswer, idx) => {
      const questionData = storedQuiz[idx];
      const isCorrect = userAnswer === questionData.correctAnswer;
      if (isCorrect) correct++;
      
      return {
        questionIndex: idx,
        question: questionData.question,
        userAnswer,
        correctAnswer: questionData.correctAnswer,
        isCorrect
      };
    });
    
    const score = Math.round((correct / totalQuestions) * 100);
    
    // Store result in database
    await storeQuizResult(quizId, answers, score, correct, totalQuestions);
    
    return res.json({
      score,
      correct,
      total: totalQuestions,
      results
    });
    
  } catch (err) {
    console.error('❌ /score-quiz error:', err);
    return res.status(500).json({ error: 'Scoring failed', details: err.message });
  }
}

// Route handler for /quiz/generate-quiz-from-material
async function handleGenerateQuizFromMaterial(req, res) {
  try {
    const body = req.body || {};
    const { topic, material, technicalLevel, learningStyle } = body;

    if (!topic || !material) {
      return res.status(400).json({ error: 'topic and material required' });
    }

    // Call the helper function (note: different name to avoid recursion)
    const questions = await generateQuizFromMaterial(topic, material, technicalLevel, learningStyle);

    const quizId = `material-quiz_${Date.now()}`;
    
    const quizData = questions.map((q, idx) => ({
      originalIndex: idx,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.answer || q.options[0],
      explanation: q.explanation || ''
    }));

    await storeQuiz(quizId, quizData, topic);

    console.log('✅ Quiz generated successfully:', quizId);

    res.setHeader('X-Quiz-Id', quizId);
    // Return quizData which has the normalized correctAnswer field
    return res.json(quizData);

  } catch (err) {
    console.error('❌ /generate-quiz-from-material error:', err);
    return res.status(500).json({ error: 'Quiz generation failed', details: err.message });
  }
}

// PDF Controllers
async function readPdf(req, res) {
  try {
    const { github_url } = req.body;
    
    console.log('📥 /read-pdf called with URL:', github_url);
    
    if (!github_url) {
      return res.status(400).json({ error: 'github_url required' });
    }

    const rpcBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: 'read_github_pdf', arguments: { github_url } }
    };

    console.log('📤 Sending request to PDF service:', rpcBody);

    const response = await axios.post('http://localhost:3333', rpcBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📥 PDF service response status:', response.status);

    const data = response.data;
    console.log('📥 PDF service response:', JSON.stringify(data).substring(0, 200));
    
    if (!data?.result?.text) {
      console.error('❌ No text extracted from PDF:', data);
      return res.status(500).json({ error: 'No text extracted', raw: data });
    }

    console.log('✅ Successfully extracted', data.result.text.length, 'characters');
    
    // Extract GitHub URLs from the extracted text
    const githubUrls = extractGitHubUrls(data.result.text);
    console.log('🔗 Found GitHub URLs:', githubUrls.length);
    
    return res.json({ 
      text: data.result.text,
      metadata: {
        githubUrls: githubUrls,
        characterCount: data.result.text.length
      }
    });

  } catch (err) {
    console.error('❌ /read-pdf error:', err);
    return res.status(500).json({ error: 'PDF extraction failed', details: err.message });
  }
}

async function readResumePdf(req, res) {
  try {
    // multer middleware should have already processed the file
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    console.log('📄 Processing Resume PDF:', req.file.originalname);

    const result = await processResumePdf(filePath);

    // Extract GitHub URLs from the extracted text
    const githubUrls = extractGitHubUrls(result.text);
    console.log('🔗 Found GitHub URLs:', githubUrls.length);

    console.log('✅ Resume PDF processed:', result.text.length, 'characters of technical content');
    return res.json({ 
      text: result.text,
      metadata: {
        githubUrls: githubUrls,
        characterCount: result.text.length
      }
    });

  } catch (err) {
    console.error('❌ /read-resume-pdf error:', err);
    return res.status(500).json({ error: 'Resume PDF extraction failed', details: err.message });
  }
}

async function generateFromPdf(req, res) {
  try {
    const { userProfile, topic } = req.body;
    if (!userProfile) return res.status(400).json({ error: 'Missing user profile' });

    // Use Gemini to generate personalized quiz questions
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Generate 5 learning style assessment questions based on this user profile:

User Profile:
${JSON.stringify(userProfile)}

Topic: ${topic || 'General Technology'}

Create questions that assess the user's learning preferences. Return JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Best answer for this user profile"
  }
]

Requirements:
- Questions should assess learning preferences (visual, auditory, reading, kinesthetic)
- Include practical scenarios
- Return ONLY valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let jsonStr = rawText.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3);
        }
        
        const questions = JSON.parse(jsonStr.trim());
        return res.json(questions);
      }
    }

    // Fallback to default questions
    const questions = [
      { question: 'How do you prefer learning new tech?', options: ['Reading docs', 'Watching videos', 'Hands-on', 'Group discussion'], answer: 'Hands-on' },
      { question: 'Do you like step-by-step tutorials?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
      { question: 'Do you take notes while learning?', options: ['Yes', 'No', 'Sometimes', 'Never'], answer: 'Yes' },
      { question: 'Do you prefer online courses or offline?', options: ['Online', 'Offline', 'Hybrid', 'Doesn\'t matter'], answer: 'Online' },
      { question: 'Do you prefer small examples or full projects?', options: ['Small examples', 'Full projects', 'Both', 'Neither'], answer: 'Both' }
    ];

    return res.json(questions);

  } catch (err) {
    console.error('❌ /generate-from-pdf error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Learning Controllers
async function generatePersonalizedContent(req, res) {
  try {
    const { topic, styleId, technicalLevel, learningStyle } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    // Use Gemini to generate personalized content
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Generate personalized content recommendations for learning ${topic}.

User profile:
- Learning Style: ${learningStyle || styleId || 'reading'}
- Technical Level: ${technicalLevel || 'intermediate'}

Create a JSON response with:

{
  "topic": "${topic}",
  "resources": [
    { "type": "Resource Type", "title": "Specific title", "description": "Why this is good for this learner", "duration": "time estimate" }
  ],
  "suggestedPath": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "tips": ["Tip 1 specific to this learning style", "Tip 2", "Tip 3"]
}

Requirements:
- Resources should be specific to ${learningStyle || 'reading'} learners
- Include a mix of resource types (articles, tutorials, exercises, projects)
- The suggested path should be actionable
- Tips should be practical
- Return ONLY valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let jsonStr = rawText.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3);
        }
        
        const content = JSON.parse(jsonStr.trim());
        return res.json(content);
      }
    }

    // Fallback to dynamic content
    const contentRecommendations = {
      topic: topic,
      resources: [
        { type: 'Article', title: `Understanding ${topic}: Core Concepts`, description: 'A comprehensive guide to foundational concepts', duration: '10-15 mins read' },
        { type: 'Tutorial', title: `${topic} Step-by-Step Guide`, description: 'Hands-on tutorial with code examples', duration: '30-45 mins' },
        { type: 'Practice', title: `Interactive ${topic} Exercises`, description: 'Code along with interactive challenges', duration: '45-60 mins' },
        { type: 'Project', title: `Build a Real Project with ${topic}`, description: 'Practical project combining multiple concepts', duration: '2-4 hours' },
        { type: 'Deep Dive', title: `Advanced ${topic} Patterns`, description: 'Expert techniques and best practices', duration: '1-2 hours' }
      ],
      suggestedPath: [
        'Start with the Article to understand basics',
        'Follow the Step-by-Step Tutorial',
        'Practice with Interactive Exercises',
        'Build something with the Project',
        'Explore Advanced Patterns for expertise'
      ],
      tips: [
        `Take your time with ${topic} - it's a foundational skill`,
        'Practice coding along with examples, don\'t just read',
        'Try modifying example code to understand deeply',
        'Build small projects to solidify your understanding'
      ]
    };

    return res.json(contentRecommendations);

  } catch (err) {
    console.error('❌ /generate-personalized-content error:', err);
    return res.status(500).json({ error: 'Content generation failed', details: err.message });
  }
}

async function generateCombinedContent(req, res) {
  try {
    const { topic, technicalLevel, technicalScore, learningStyle, learningScore, combinedAnalysis } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    // Use Gemini to generate personalized content based on user profile
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Generate a highly personalized learning path for a user with the following profile:

- Topic: ${topic}
- Technical Level: ${technicalLevel || 'intermediate'}
- Technical Score: ${technicalScore || 50}%
- Learning Style: ${learningStyle || 'reading'}
- Learning Score: ${learningScore || 50}%

Create a JSON response with the following structure:

{
  "title": "Personalized ${topic} Learning Path",
  "overview": "A 2-3 sentence overview of what this learner will achieve",
  "learningPath": [
    "Step 1: [Specific action for this user profile]",
    "Step 2: [Specific action for this user profile]",
    "Step 3: [Specific action for this user profile]",
    "Step 4: [Specific action for this user profile]",
    "Step 5: [Specific action for this user profile]"
  ],
  "resources": [
    "Specific resource 1 tailored to ${learningStyle} learners at ${technicalLevel} level",
    "Specific resource 2 tailored to ${learningStyle} learners",
    "Specific resource 3"
  ],
  "tips": [
    "Tip 1 specific to ${learningStyle} learning style",
    "Tip 2 specific to ${learningStyle} learners",
    "Tip 3 for ${technicalLevel} level learners"
  ],
  "nextSteps": "Specific next action based on the user's scores (technical: ${technicalScore}%, learning: ${learningScore}%)",
  "combinedAnalysis": "Analysis of user: Technical ${technicalLevel} (${technicalScore}%), Learning style: ${learningStyle} (${learningScore}%)"
}

Requirements:
- Content must be genuinely personalized based on the user's scores and learning style
- ${learningStyle === 'visual' ? 'Include references to diagrams, videos, and visual content' : learningStyle === 'auditory' ? 'Include references to podcasts, videos, and audio content' : learningStyle === 'kinesthetic' ? 'Include hands-on exercises, projects, and practical activities' : 'Include reading materials, written tutorials, and text-based content'}
- ${technicalLevel === 'beginner' ? 'Use simple language, provide more guidance, break down into smaller steps' : technicalLevel === 'advanced' ? 'Use technical language, provide less guidance, focus on advanced concepts' : 'Balance between simple and technical language'}
- Return ONLY valid JSON, no additional text.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const rawText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let jsonStr = rawText.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3);
        }
        
        const content = JSON.parse(jsonStr.trim());
        return res.json(content);
      }
    }

    // Fallback to dynamic content if Gemini fails
    const content = {
      title: `Personalized ${topic} Learning Path`,
      overview: `A concise learning path for a ${technicalLevel?.toLowerCase() || 'intermediate'} ${learningStyle?.toLowerCase() || 'reading'} learner. Focused steps, quick tips, and practical next actions.`,
      learningPath: [
        `1) Core Concepts — Learn the essential ideas and terminology for ${topic}`,
        `2) Practical Exercises — Complete short hands-on tasks to apply concepts`,
        `3) Mini Project — Build a small project integrating the core concepts`,
        `4) Advanced Patterns — Study 2-3 advanced topics or real-world patterns`,
        `5) Review & Reinforce — Revisit weak areas and solidify understanding`
      ],
      sections: [
        {
          title: 'Plan',
          bullets: [
            `Duration: ~2-6 hours per major step depending on level`,
            'Deliverable: small working project after step 3',
            'Assessment: quick quiz after each major step'
          ]
        },
        {
          title: 'What to Practice',
          bullets: [
            'Focus on 3 core tasks related to the topic',
            'Implement one end-to-end example',
            'Write and run short tests or checks'
          ]
        }
      ],
      tips: [
        'Start small: implement tiny examples before full projects',
        'Use deliberate practice: repeat a focused exercise until fluent',
        'Read code + modify it: change examples to see effects',
        'Timebox learning sessions (e.g., 45–90 minutes) and review briefly afterwards'
      ],
      nextSteps: 'Follow the 5-step path in order; after the mini project, take a short quiz to validate learning.',
      combinedAnalysis: combinedAnalysis || `Technical: ${technicalLevel} (${technicalScore}%), Learner: ${learningStyle} (${learningScore}%)`
    };

    return res.json(content);

  } catch (err) {
    console.error('❌ /generate-combined-content error:', err);
    return res.status(500).json({ error: 'Combined content generation failed', details: err.message });
  }
}

async function generateLearningMaterialHandler(req, res) {
  try {
    const { topic, technicalLevel, learningStyle } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'topic required' });
    }

    const material = await generateLearningMaterial(topic, technicalLevel, learningStyle);
    return res.json(material);

  } catch (err) {
    console.error('❌ /generate-learning-material error:', err);
    return res.status(500).json({ error: 'Learning material generation failed', details: err.message });
  }
}

async function generateLearningQuestions(req, res) {
  try {
    const questions = [
      { id: 1, question: 'How would you describe your familiarity with learning new technical concepts?', options: ['I am new and need step-by-step guidance', 'I have some experience and can learn with moderate help', 'I am comfortable learning challenging concepts independently'], answer: 'I have some experience and can learn with moderate help', category: 'technical_familiarity' },
      { id: 2, question: 'How comfortable are you reading technical documentation?', options: ['I prefer simple tutorials instead', 'I can understand documentation with some help', 'I regularly learn directly from documentation'], answer: 'I can understand documentation with some help', category: 'documentation_skill' },
      { id: 3, question: 'When learning a new topic, what is your usual learning goal?', options: ['Understand the basics only', 'Build working applications', 'Master advanced concepts and optimizations'], answer: 'Build working applications', category: 'learning_goal' },
      { id: 4, question: 'How confident are you in applying what you learned to a real project?', options: ['I need detailed instructions', 'I can implement with some guidance', 'I can design and implement independently'], answer: 'I can implement with some guidance', category: 'application_confidence' },
      { id: 5, question: 'When learning a difficult concept, what do you usually do?', options: ['Wait for a simpler explanation', 'Practice until I understand', 'Research deeply from multiple resources'], answer: 'Practice until I understand', category: 'learning_behavior' }
    ];

    return res.json(questions);

  } catch (err) {
    console.error('❌ /generate-learning-questions error:', err);
    return res.status(500).json({ error: 'Learning questions generation failed', details: err.message });
  }
}

async function evaluateLearningStyle(req, res) {
  try {
    const { answers, topic } = req.body;

    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({ error: 'Expected 5 answers' });
    }

    const scores = {
      technicalFamiliarity: 0,
      documentationSkill: 0,
      learningGoal: 0,
      applicationConfidence: 0,
      learningBehavior: 0
    };

    const categories = ['technicalFamiliarity', 'documentationSkill', 'learningGoal', 'applicationConfidence', 'learningBehavior'];

    answers.forEach((answer, index) => {
      const category = categories[index];
      let score = 0;
      
      // Map answer string to numeric score (Option 1 = 0, Option 2 = 1, Option 3 = 2)
      const optionIndex = [0, 1, 2];
      
      if (index === 0) { // technical_familiarity
        if (answer === 'I am new and need step-by-step guidance') score = 0;
        else if (answer === 'I have some experience and can learn with moderate help') score = 1;
        else if (answer === 'I am comfortable learning challenging concepts independently') score = 2;
      } else if (index === 1) { // documentation_skill
        if (answer === 'I prefer simple tutorials instead') score = 0;
        else if (answer === 'I can understand documentation with some help') score = 1;
        else if (answer === 'I regularly learn directly from documentation') score = 2;
      } else if (index === 2) { // learning_goal
        if (answer === 'Understand the basics only') score = 0;
        else if (answer === 'Build working applications') score = 1;
        else if (answer === 'Master advanced concepts and optimizations') score = 2;
      } else if (index === 3) { // application_confidence
        if (answer === 'I need detailed instructions') score = 0;
        else if (answer === 'I can implement with some guidance') score = 1;
        else if (answer === 'I can design and implement independently') score = 2;
      } else if (index === 4) { // learning_behavior
        if (answer === 'Wait for a simpler explanation') score = 0;
        else if (answer === 'Practice until I understand') score = 1;
        else if (answer === 'Research deeply from multiple resources') score = 2;
      }
      
      if (scores.hasOwnProperty(category)) {
        scores[category] = score;
      }
    });

    // Calculate Technical Score (technical_familiarity + documentation_skill)
    const technicalScore = scores.technicalFamiliarity + scores.documentationSkill;
    
    // Calculate Learning Score (learning_goal + application_confidence + learning_behavior)
    const learningScore = scores.learningGoal + scores.applicationConfidence + scores.learningBehavior;
    
    // Total score
    const totalScore = technicalScore + learningScore;
    const maxScore = 10;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Determine overall level
    let learnerLevel = 'Beginner';
    if (totalScore >= 8) {
      learnerLevel = 'Advanced';
    } else if (totalScore >= 4) {
      learnerLevel = 'Intermediate';
    }

    // Determine individual category levels
    const levels = {};
    Object.entries(scores).forEach(([key, score]) => {
      if (score === 0) levels[key] = 'Beginner';
      else if (score === 1) levels[key] = 'Intermediate';
      else levels[key] = 'Advanced';
    });

    const styleId = `style_${Date.now()}`;

    console.log(`✅ Learner level evaluated for topic ${topic}:`, { styleId, learnerLevel, percentage, scores, levels });

    return res.json({
      success: true,
      styleId,
      learnerLevel,
      score: percentage,
      technicalScore,
      learningScore,
      profile: { levels, scores }
    });

  } catch (err) {
    console.error('❌ /evaluate-learning-style error:', err);
    return res.status(500).json({ error: 'Learning style evaluation failed', details: err.message });
  }
}

async function downloadPdf(req, res) {
  try {
    const { content, filename } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const safeFilename = (filename || 'learning-material').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(safeFilename)}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.removeHeader('X-Powered-By');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Learning Material', { align: 'center' });
    doc.moveDown();

    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^={30,}$/) || line.match(/^-{30,}$/)) {
        continue;
      }

      if (line.match(/^[A-Z\s]+:$/)) {
        doc.fontSize(14).font('Helvetica-Bold').text(line, { continued: false });
        doc.moveDown(0.3);
      } else if (line.match(/^\d+\.\s+/) && !line.includes('.')) {
        doc.fontSize(14).font('Helvetica-Bold').text(line, { continued: false });
        doc.moveDown(0.3);
      } else if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
        doc.fontSize(11).font('Helvetica').text(line, { continued: false });
      } else if (!line.trim()) {
        doc.moveDown(0.5);
      } else {
        doc.fontSize(11).font('Helvetica').text(line, { continued: false, lineBreak: true });
      }
    }

    doc.end();
    console.log('✅ PDF generated successfully');

  } catch (err) {
    console.error('❌ /download-pdf error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'PDF generation failed', details: err.message });
    }
  }
}

// Analysis Controllers
async function saveAnalysis(req, res) {
  try {
    const {
      userId,
      sourceType,
      sourceUrl,
      extractedText,
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      overallScore
    } = req.body;

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await saveUserAnalysis({
      id: analysisId,
      userId,
      sourceType,
      sourceUrl,
      extractedText,
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      overallScore
    });

    if (result.success) {
      return res.json({
        success: true,
        analysisId,
        message: 'Analysis saved successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to save analysis', details: result.error });
    }
  } catch (err) {
    console.error('❌ /save-analysis error:', err);
    return res.status(500).json({ error: 'Analysis save failed', details: err.message });
  }
}

async function getAnalyses(req, res) {
  try {
    const { userId } = req.query;
    
    const analyses = await getUserAnalyses(userId);
    
    return res.json({
      success: true,
      analyses,
      count: analyses.length
    });
  } catch (err) {
    console.error('❌ /analyses error:', err);
    return res.status(500).json({ error: 'Failed to fetch analyses', details: err.message });
  }
}

async function getAnalysisById(req, res) {
  try {
    const { id } = req.params;
    
    const analysis = await getUserAnalysis(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    return res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('❌ /analysis/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch analysis', details: err.message });
  }
}

async function updateAnalysis(req, res) {
  try {
    const { id } = req.params;
    const {
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      topic,
      learningScore,
      technicalScore,
      psychometricProfile
    } = req.body;

    const result = await updateUserAnalysis(id, {
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      topic,
      learningScore,
      technicalScore,
      psychometricProfile
    });

    if (result.success) {
      return res.json({
        success: true,
        analysisId: id,
        message: 'Analysis updated successfully'
      });
    } else {
      return res.status(404).json({ error: result.error || 'Failed to update analysis' });
    }
  } catch (err) {
    console.error('❌ /analysis/:id PUT error:', err);
    return res.status(500).json({ error: 'Analysis update failed', details: err.message });
  }
}

async function updateLastActive(req, res) {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `UPDATE user_analyses SET updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.json({ success: true, message: 'Last active updated' });
  } catch (err) {
    console.error('❌ /analysis/:id/last-active error:', err);
    return res.status(500).json({ error: 'Failed to update last active', details: err.message });
  }
}

async function saveOnboardingGoal(req, res) {
  try {
    const { userId, careerGoal, experienceLevel } = req.body;
    
    if (!userId || !careerGoal) {
      return res.status(400).json({ error: 'userId and careerGoal are required' });
    }
    
    const existingAnalyses = await getUserAnalyses(userId);
    
    if (existingAnalyses && existingAnalyses.length > 0) {
      const analysisId = existingAnalyses[0].id;
      await db.query(
        `UPDATE user_analyses 
         SET career_goal = $1, goal = $1, experience_level = $2, onboarding_completed = TRUE, updated_at = NOW()
         WHERE id = $3`,
        [careerGoal, experienceLevel || null, analysisId]
      );
      
      return res.json({
        success: true,
        message: 'Onboarding goal saved',
        analysisId
      });
    } else {
      const analysisId = `onboarding_${userId}_${Date.now()}`;
      await db.query(
        `INSERT INTO user_analyses 
         (id, user_id, career_goal, goal, experience_level, onboarding_completed, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, TRUE, NOW(), NOW())`,
        [analysisId, userId, careerGoal, experienceLevel || null]
      );
      
      return res.json({
        success: true,
        message: 'Onboarding goal saved',
        analysisId
      });
    }
  } catch (err) {
    console.error('❌ /onboarding/goal error:', err);
    return res.status(500).json({ error: 'Failed to save goal', details: err.message });
  }
}

// ==================== ROUTER SETUP ====================
const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware setup
app.use(cors({
  origin: CORS_ORIGIN,
  exposedHeaders: ['X-Quiz-Id']
}));

app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Initialize database on startup
initDatabase();

// ==================== ROUTES (Monolithic - without /api/ prefix) ====================

// Quiz routes
app.post('/quiz/generate', clerkAuth, generateQuiz);
app.post('/quiz/score-quiz', clerkAuth, scoreQuiz);
app.post('/quiz/generate-quiz-from-material', clerkAuth, handleGenerateQuizFromMaterial);

// PDF routes
app.post('/pdf/read-pdf', clerkAuth, readPdf);
app.post('/pdf/read-resume-pdf', upload.single('pdf'), (req, res, next) => {
  if (req.file === undefined && !req.file) {
    // File wasn't uploaded through multer, continue anyway
  }
  next();
}, readResumePdf);
app.post('/pdf/generate-from-pdf', clerkAuth, generateFromPdf);

// Learning routes
app.post('/learning/generate-personalized-content', clerkAuth, generatePersonalizedContent);
app.post('/learning/generate-combined-content', clerkAuth, generateCombinedContent);
app.post('/learning/generate-learning-material', clerkAuth, generateLearningMaterialHandler);
app.post('/learning/generate-learning-questions', clerkAuth, generateLearningQuestions);
app.post('/learning/evaluate-learning-style', clerkAuth, evaluateLearningStyle);
app.post('/learning/download-pdf', clerkAuth, downloadPdf);

// Analysis routes (under /)
app.post('/save-analysis', clerkAuth, saveAnalysis);
app.get('/analyses', clerkAuth, getAnalyses);
app.get('/analysis/:id', clerkAuth, getAnalysisById);
app.put('/analysis/:id', clerkAuth, updateAnalysis);
app.patch('/analysis/:id/last-active', clerkAuth, updateLastActive);
app.post('/onboarding/goal', clerkAuth, saveOnboardingGoal);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server - load agent routes and THEN mount error handlers
async function startServer() {
  // Load agent routes synchronously before starting server
  const { default: agentRoutes } = await import('./agents/routes.js');
  app.use('/agent', agentRoutes);
  console.log('✅ Agent routes mounted');
  
  // Error handling middleware - mount AFTER all routes including agent routes
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;
