import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pg from 'pg';

import { generateQuestions } from "../pdf/questionGenerator.js";

dotenv.config();

// PostgreSQL connection pool
const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(100) PRIMARY KEY,
        topic VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    await pool.query(`
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
    
    await pool.query(`
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
    
    // Create user_analyses table for persisting analysis data
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
    
    // Create indexes for user_analyses
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_analyses_created_at ON user_analyses(created_at)`);
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
}

// Initialize on startup
initDatabase();

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  exposedHeaders: ["X-Quiz-Id"]
}));

app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// In-memory store for quizzes (fallback)
const answerStore = {};

// ===============================
// DATABASE HELPER FUNCTIONS
// ===============================

async function storeQuiz(quizId, quizData, topic) {
  try {
    await pool.query(
      `INSERT INTO quizzes (id, topic, created_at, expires_at) 
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours') 
       ON CONFLICT (id) DO NOTHING`,
      [quizId, topic || 'Quiz']
    );

    for (const q of quizData) {
      await pool.query(
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
    const result = await pool.query(
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
    await pool.query(
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

// ===============================
// USER ANALYSIS HELPER FUNCTIONS
// ===============================

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

    await pool.query(
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

async function getUserAnalysis(analysisId) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, source_type, source_url, extracted_text, skills, strengths, weak_areas,
              ai_recommendations, learning_roadmap, technical_level, learning_style, overall_score,
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
    const result = await pool.query(
      `SELECT id, user_id, source_type, source_url, technical_level, learning_style, overall_score,
              created_at, updated_at
       FROM user_analyses 
       WHERE user_id = $1 OR $1 IS NULL
       ORDER BY created_at DESC`,
      [userId || null]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      technicalLevel: row.technical_level,
      learningStyle: row.learning_style,
      overallScore: row.overall_score,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.error('❌ Error getting user analyses:', err.message);
    return [];
  }
}

// ===============================
// READ PDF FROM GITHUB
// ===============================
app.post("/read-pdf", async (req, res) => {
  try {
    const { github_url } = req.body;
    if (!github_url) return res.status(400).json({ error: "github_url required" });

    const rpcBody = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: "read_github_pdf", arguments: { github_url } }
    };

    const response = await fetch("http://localhost:3333", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcBody)
    });

    if (!response.ok) {
      const txt = await response.text();
      return res.status(500).json({ error: "PDF service failed", details: txt });
    }

    const data = await response.json();
    if (!data?.result?.text) return res.status(500).json({ error: "No text extracted", raw: data });

    return res.json({ text: data.result.text });

  } catch (err) {
    console.error("❌ /read-pdf error:", err);
    return res.status(500).json({ error: "PDF extraction failed", details: err.message });
  }
});

// ===============================
// READ RESUME PDF FROM UPLOAD
// ===============================
app.post("/read-resume-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    console.log("📄 Processing Resume PDF:", req.file.originalname);

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF file is too small or empty" });
    }

    // Extract text from PDF
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length < 50) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Filter technical content from resume
    const technicalText = filterTechnicalContent(data.text);

    if (technicalText.length < 100) {
      return res.status(400).json({ 
        error: "Not enough technical content to generate questions.",
        details: "Resume appears to lack technical skills, experience, or projects."
      });
    }

    console.log("✅ Resume PDF processed:", technicalText.length, "characters of technical content");

    return res.json({ text: technicalText });

  } catch (err) {
    console.error("❌ /read-resume-pdf error:", err);
    return res.status(500).json({ error: "Resume PDF extraction failed", details: err.message });
  }
});

// ===============================
// FILTER TECHNICAL CONTENT FROM RESUME
// ===============================
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

// ===============================
// GENERATE MCQ QUESTIONS
// ===============================
app.post("/generate", async (req, res) => {
  try {
    const { docText, topic } = req.body;
    let text = "";

    if (docText && docText.trim().length > 100) {
      text = docText;
    } else if (topic && topic.trim()) {
      text = `Generate questions on topic: ${topic}`;
    } else {
      return res.status(400).json({ error: "docText or topic required" });
    }

    const questions = await generateQuestions(text);
    if (!Array.isArray(questions)) throw new Error("Invalid Gemini response");

    const quizId = `quiz_${Date.now()}`;
    
    // Normalize stored answers: convert letter/index to actual option text
    // ALSO shuffle questions and store mapping to original positions
    const quizData = questions.map((q, idx) => {
      const ans = q.answer;
      const opts = Array.isArray(q.options) ? q.options : [];
      let normalizedAns = ans;

      // Convert letter to full text
      if (typeof ans === "string" && /^[A-D]$/i.test(ans) && opts.length > 0) {
        const ansIdx = ans.toUpperCase().charCodeAt(0) - 65;
        normalizedAns = opts[ansIdx] || opts[0];
      }
      // Convert index to full text
      if (typeof ans === "number" && opts.length > 0) {
        normalizedAns = opts[ans] || opts[0];
      }
      // If no answer, set to empty string (will show as wrong)
      if (!ans) {
        normalizedAns = "";
      }

      return {
        originalIndex: idx,
        question: q.question,
        options: opts,
        correctAnswer: normalizedAns
      };
    });

    answerStore[quizId] = {
      quizData,
      totalQuestions: questions.length
    };

    // Also store in database for persistence
    await storeQuiz(quizId, quizData, topic);

    console.log("✅ Quiz stored:", quizId);

    res.setHeader("X-Quiz-Id", quizId);
   

    return res.json(questions);

  } catch (err) {
    console.error("❌ /generate error:", err);
    const msg = err && err.message ? err.message : String(err);

    // If request didn't include enough content, return 400
    if (msg.toLowerCase().includes("not enough content")) {
      return res.status(400).json({ error: "not_enough_content", message: "Document too short for question generation. Provide a longer document or topic." });
    }

    // If the underlying AI client returned a rate-limit / quota error, surface a 429
    if (msg.includes("Too Many Requests") || msg.toLowerCase().includes("quota")) {
      return res.status(429).json({
        error: "rate_limit",
        message: "External AI quota exceeded. Try again later or check usage and quotas: https://ai.dev/rate-limit"
      });
    }

    return res.status(500).json({ error: "Question generation failed", details: msg });
  }
});

// ===============================
// SCORE QUIZ
// Uses database for persistent storage with memory fallback
// ===============================
app.post("/score-quiz", async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "quizId and answers array required" });
    }
    
    // Try database first, then fall back to memory
    let quizData = await getQuiz(quizId);
    if (!quizData && answerStore[quizId]) {
      quizData = answerStore[quizId];
    }
    
    if (!quizData) {
      return res.status(404).json({ error: "Quiz not found" });
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
    
    // Clean up memory store
    delete answerStore[quizId];
    
    return res.json({
      score,
      correct,
      total: totalQuestions,
      results
    });
    
  } catch (err) {
    console.error("❌ /score-quiz error:", err);
    return res.status(500).json({ error: "Scoring failed", details: err.message });
  }
});

// ===============================
// PERSONALIZED LEARNING QUIZ
// No score evaluation needed
// ===============================
app.post("/generate-from-pdf", async (req, res) => {
  try {
    const { userProfile } = req.body;
    if (!userProfile) return res.status(400).json({ error: "Missing user profile" });

    // 5 learning-preference questions (example)
    const questions = [
      { question: "How do you prefer learning new tech?", options: ["Reading docs","Watching videos","Hands-on","Group discussion"], answer: "Hands-on" },
      { question: "Do you like step-by-step tutorials?", options: ["Yes","No","Sometimes","Never"], answer: "Yes" },
      { question: "Do you take notes while learning?", options: ["Yes","No","Sometimes","Never"], answer: "Yes" },
      { question: "Do you prefer online courses or offline?", options: ["Online","Offline","Hybrid","Doesn't matter"], answer: "Online" },
      { question: "Do you prefer small examples or full projects?", options: ["Small examples","Full projects","Both","Neither"], answer: "Both" }
    ];

    return res.json(questions);

  } catch (err) {
    console.error("❌ /generate-from-pdf error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ===============================
// GENERATE LEARNER LEVEL ASSESSMENT QUESTIONS
// ===============================
// Returns psychometric questions to measure:
// - Technical familiarity
// - Documentation skill
// - Learning goal
// - Application confidence
// - Learning behavior
// Each question has exactly 3 options (Beginner / Intermediate / Advanced)
app.post("/generate-learning-questions", async (req, res) => {
  try {
    const questions = [
      {
        id: 1,
        question: "How would you describe your familiarity with learning new technical concepts?",
        options: [
          "I am new and need step-by-step guidance",
          "I have some experience and can learn with moderate help",
          "I am comfortable learning challenging concepts independently"
        ],
        category: "technical_familiarity"
      },
      {
        id: 2,
        question: "How comfortable are you reading technical documentation?",
        options: [
          "I prefer simple tutorials instead",
          "I can understand documentation with some help",
          "I regularly learn directly from documentation"
        ],
        category: "documentation_skill"
      },
      {
        id: 3,
        question: "When learning a new topic, what is your usual learning goal?",
        options: [
          "Understand the basics only",
          "Build working applications",
          "Master advanced concepts and optimizations"
        ],
        category: "learning_goal"
      },
      {
        id: 4,
        question: "How confident are you in applying what you learned to a real project?",
        options: [
          "I need detailed instructions",
          "I can implement with some guidance",
          "I can design and implement independently"
        ],
        category: "application_confidence"
      },
      {
        id: 5,
        question: "When learning a difficult concept, what do you usually do?",
        options: [
          "Wait for a simpler explanation",
          "Practice until I understand",
          "Research deeply from multiple resources"
        ],
        category: "learning_behavior"
      }
    ];

    return res.json(questions);

  } catch (err) {
    console.error("❌ /generate-learning-questions error:", err);
    return res.status(500).json({ error: "Learning questions generation failed", details: err.message });
  }
});

// ===============================
// EVALUATE LEARNER LEVEL
// ===============================
// Evaluates psychometric answers and determines learner level
// Each question has 3 options: Beginner (0), Intermediate (1), Advanced (2)
app.post("/evaluate-learning-style", (req, res) => {
  try {
    const { answers, topic } = req.body;

    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({ error: "Expected 5 answers" });
    }

    // Score each dimension (0 = Beginner, 1 = Intermediate, 2 = Advanced)
    const scores = {
      technicalFamiliarity: 0,
      documentationSkill: 0,
      learningGoal: 0,
      applicationConfidence: 0,
      learningBehavior: 0
    };

    const categories = ["technicalFamiliarity", "documentationSkill", "learningGoal", "applicationConfidence", "learningBehavior"];

    answers.forEach((answer, index) => {
      const category = categories[index];
      if (scores.hasOwnProperty(category)) {
        scores[category] = answer; // answer is the score (0, 1, or 2)
      }
    });

    // Calculate overall learner level
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const maxScore = 5 * 2; // 5 questions, max 2 points each
    const percentage = Math.round((totalScore / maxScore) * 100);

    let learnerLevel = "Beginner";
    if (percentage >= 70) {
      learnerLevel = "Advanced";
    } else if (percentage >= 40) {
      learnerLevel = "Intermediate";
    }

    // Determine individual levels
    const levels = {};
    Object.entries(scores).forEach(([key, score]) => {
      if (score === 0) levels[key] = "Beginner";
      else if (score === 1) levels[key] = "Intermediate";
      else levels[key] = "Advanced";
    });

    // Store internally
    const styleId = `style_${Date.now()}`;

    console.log(`✅ Learner level evaluated for topic ${topic}:`, {
      styleId,
      learnerLevel,
      percentage,
      scores,
      levels
    });

    // Return profile data to frontend
    return res.json({
      success: true,
      styleId: styleId,
      learnerLevel: learnerLevel,
      score: percentage,
      profile: {
        levels,
        scores
      }
    });

  } catch (err) {
    console.error("❌ /evaluate-learning-style error:", err);
    return res.status(500).json({ error: "Learning style evaluation failed", details: err.message });
  }
});

// ===============================
// GENERATE PERSONALIZED CONTENT
// ===============================
// Generates content recommendations based on learning style + topic
app.post("/generate-personalized-content", async (req, res) => {
  try {
    const { topic, styleId } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic required" });
    }

    // Generate personalized learning content recommendations
    const contentRecommendations = {
      topic: topic,
      resources: [
        {
          type: "Article",
          title: `Understanding ${topic}: Core Concepts`,
          description: "A comprehensive guide to foundational concepts",
          duration: "10-15 mins read"
        },
        {
          type: "Tutorial",
          title: `${topic} Step-by-Step Guide`,
          description: "Hands-on tutorial with code examples",
          duration: "30-45 mins"
        },
        {
          type: "Practice",
          title: `Interactive ${topic} Exercises`,
          description: "Code along with interactive challenges",
          duration: "45-60 mins"
        },
        {
          type: "Project",
          title: `Build a Real Project with ${topic}`,
          description: "Practical project combining multiple concepts",
          duration: "2-4 hours"
        },
        {
          type: "Deep Dive",
          title: `Advanced ${topic} Patterns`,
          description: "Expert techniques and best practices",
          duration: "1-2 hours"
        }
      ],
      suggestedPath: [
        "Start with the Article to understand basics",
        "Follow the Step-by-Step Tutorial",
        "Practice with Interactive Exercises",
        "Build something with the Project",
        "Explore Advanced Patterns for expertise"
      ],
      tips: [
        `Take your time with ${topic} - it's a foundational skill`,
        "Practice coding along with examples, don't just read",
        "Try modifying example code to understand deeply",
        "Build small projects to solidify your understanding"
      ]
    };

    return res.json(contentRecommendations);

  } catch (err) {
    console.error("❌ /generate-personalized-content error:", err);
    return res.status(500).json({ error: "Content generation failed", details: err.message });
  }
});

// ===============================
// GENERATE COMBINED CONTENT
// ===============================
// Generates personalized content combining technical level + learning style
app.post("/generate-combined-content", async (req, res) => {
  try {
    const { topic, technicalLevel, technicalScore, learningStyle, learningScore, combinedAnalysis } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic required" });
    }

    // Generate concise combined content (minimal matter, clear bullet path, tips)
    const content = {
      title: `Personalized ${topic} Learning Path`,
      overview: `A concise learning path for a ${technicalLevel.toLowerCase()} ${learningStyle.toLowerCase()} learner. Focused steps, quick tips, and practical next actions.`,

      // Clear, minimal bullet-style learning path
      learningPath: [
        `1) Core Concepts — Learn the essential ideas and terminology for ${topic}`,
        `2) Practical Exercises — Complete short hands-on tasks to apply concepts`,
        `3) Mini Project — Build a small project integrating the core concepts`,
        `4) Advanced Patterns — Study 2-3 advanced topics or real-world patterns`,
        `5) Review & Reinforce — Revisit weak areas and solidify understanding`
      ],

      // Short sections presented as bullets (minimal text)
      sections: [
        {
          title: "Plan",
          bullets: [
            `Duration: ~2-6 hours per major step depending on level`,
            `Deliverable: small working project after step 3`,
            `Assessment: quick quiz after each major step`
          ]
        },
        {
          title: "What to Practice",
          bullets: [
            "Focus on 3 core tasks related to the topic",
            "Implement one end-to-end example",
            "Write and run short tests or checks"
          ]
        }
      ],

      // Tips & Tricks - short, actionable items
      tips: [
        `Start small: implement tiny examples before full projects`,
        `Use deliberate practice: repeat a focused exercise until fluent`,
        `Read code + modify it: change examples to see effects`,
        `Timebox learning sessions (e.g., 45–90 minutes) and review briefly afterwards`
      ],

      nextSteps: `Follow the 5-step path in order; after the mini project, take a short quiz to validate learning.`,

      combinedAnalysis: combinedAnalysis || `Technical: ${technicalLevel} (${technicalScore}%), Learner: ${learningStyle} (${learningScore}%)`
    };

    return res.json(content);

  } catch (err) {
    console.error("❌ /generate-combined-content error:", err);
    return res.status(500).json({ error: "Combined content generation failed", details: err.message });
  }
});

// ===============================
// GENERATE LEARNING MATERIAL
// ===============================
// Generates exact learning material based on topic, level, and learning style
app.post("/generate-learning-material", async (req, res) => {
  try {
    const { topic, technicalLevel, learningStyle } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic required" });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create a detailed prompt for learning material generation
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

    console.log("📚 Generating learning material for:", topic);

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const rawText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty Gemini output for learning material");
    }

    console.log("✅ Learning material generated successfully");

    let material;
    try {
      material = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Failed to parse learning material JSON");
      throw new Error("Invalid JSON response from AI");
    }

    return res.json(material);

  } catch (err) {
    console.error("❌ /generate-learning-material error:", err);
    return res.status(500).json({ error: "Learning material generation failed", details: err.message });
  }
});

// ===============================
// GENERATE QUIZ FROM LEARNING MATERIAL
// ===============================
app.post("/generate-quiz-from-material", async (req, res) => {
  try {
    const { topic, material, technicalLevel, learningStyle } = req.body;

    if (!topic || !material) {
      return res.status(400).json({ error: "topic and material required" });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create a detailed material summary from sections
    const materialSummary = material.sections
      ?.map(s => `${s.title}: ${s.content}`)
      .join("\n\n") || material.summary || "";

    const prompt = `Based on this learning material about ${topic}, generate 10 comprehensive multiple-choice questions to test understanding:

Learning Material Summary:
${materialSummary}

Generate questions that:
1. Test understanding of key concepts covered
2. Include practical application scenarios
3. Range from basic to advanced difficulty
4. Have clear, distinct options
5. Are relevant to ${technicalLevel} level learners

Return ONLY valid JSON in this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Why this is the correct answer and explanation"
  }
]

No additional text, only JSON.`;

    console.log("📝 Generating quiz from learning material...");

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const rawText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty Gemini output for quiz");
    }

    let questions;
    try {
      questions = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Failed to parse quiz JSON");
      throw new Error("Invalid JSON response from AI");
    }

    const quizId = `material-quiz_${Date.now()}`;
    
    // Store quiz answers
    const quizData = questions.map((q, idx) => ({
      originalIndex: idx,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.answer || q.options[0],
      explanation: q.explanation || ""
    }));

    answerStore[quizId] = {
      quizData,
      totalQuestions: questions.length
    };

    // Also store in database for persistence
    await storeQuiz(quizId, quizData, topic);

    console.log("✅ Quiz generated successfully:", quizId);

    res.setHeader("X-Quiz-Id", quizId);
    return res.json(questions);

  } catch (err) {
    console.error("❌ /generate-quiz-from-material error:", err);
    return res.status(500).json({ error: "Quiz generation failed", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// ===============================
// USER ANALYSIS API ROUTES
// ===============================

// Save analysis result
app.post("/save-analysis", async (req, res) => {
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

    // Generate unique analysis ID
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
        message: "Analysis saved successfully"
      });
    } else {
      return res.status(500).json({ error: "Failed to save analysis", details: result.error });
    }
  } catch (err) {
    console.error("❌ /save-analysis error:", err);
    return res.status(500).json({ error: "Analysis save failed", details: err.message });
  }
});

// Get all analyses for a user
app.get("/analyses", async (req, res) => {
  try {
    const { userId } = req.query;
    
    const analyses = await getUserAnalyses(userId);
    
    return res.json({
      success: true,
      analyses,
      count: analyses.length
    });
  } catch (err) {
    console.error("❌ /analyses error:", err);
    return res.status(500).json({ error: "Failed to fetch analyses", details: err.message });
  }
});

// Get a specific analysis by ID
app.get("/analysis/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysis = await getUserAnalysis(id);
    
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    
    return res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error("❌ /analysis/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch analysis", details: err.message });
  }
});

// ===============================
// TEMPORARY DEBUG ROUTE - DELETE AFTER USE
// ===============================
app.get("/debug-db", async (req, res) => {
  try {
    const quizzesResult = await pool.query("SELECT COUNT(*) FROM quizzes");
    const quizQuestionsResult = await pool.query("SELECT COUNT(*) FROM quiz_questions");
    const quizResultsResult = await pool.query("SELECT COUNT(*) FROM quiz_results");
    const analysesResult = await pool.query("SELECT COUNT(*) FROM user_analyses");

    res.json({
      quizzes: parseInt(quizzesResult.rows[0].count),
      quiz_questions: parseInt(quizQuestionsResult.rows[0].count),
      quiz_results: parseInt(quizResultsResult.rows[0].count),
      user_analyses: parseInt(analysesResult.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ /debug-db error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
