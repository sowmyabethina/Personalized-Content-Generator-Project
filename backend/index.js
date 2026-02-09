import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse";

import { generateQuestions } from "../pdf/questionGenerator.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  exposedHeaders: ["X-Quiz-Id"]
}));

app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// In-memory store for quizzes
const answerStore = {};

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

    
    console.log("✅ Quiz stored:", quizId, answerStore[quizId]);

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
// Uses server-side stored answers for accurate scoring
// ===============================
app.post("/score-quiz", async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "quizId and answers array required" });
    }
    
    const quizData = answerStore[quizId];
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
    
    // Clean up stored quiz data after scoring
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

    // Generate combined content based on both technical proficiency and learning style
    const content = {
      title: `Personalized ${topic} Learning Path`,
      summary: `A customized learning experience designed for a ${technicalLevel.toLowerCase()} learner with a ${learningStyle.toLowerCase()} approach.`,
      
      sections: [
        {
          title: "Getting Started",
          content: `Based on your ${technicalLevel} technical level, we'll start with ${technicalLevel === 'Beginner' ? 'foundational concepts' : technicalLevel === 'Intermediate' ? 'key principles and best practices' : 'advanced techniques and expert patterns'}.`,
          keyPoints: [
            `Target level: ${technicalLevel}`,
            `Learning approach: ${learningStyle}`,
            `Technical score: ${technicalScore}%`,
            `Learning score: ${learningScore}%`
          ]
        },
        {
          title: "Core Concepts",
          content: `As a ${learningStyle}, you'll learn through ${learningStyle.includes('Hands-On') ? 'practical exercises and coding challenges' : learningStyle.includes('Theory') ? 'comprehensive explanations and documentation' : 'a balanced mix of theory and practice'}.`,
          keyPoints: [
            "Focus on practical application",
            "Build real-world examples",
            "Practice makes perfect"
          ]
        },
        {
          title: "Hands-On Practice",
          content: "Apply what you've learned through guided exercises and projects.",
          keyPoints: [
            "Complete coding exercises",
            "Build a sample project",
            "Review and iterate on your work"
          ]
        },
        {
          title: "Advanced Topics",
          content: `Once comfortable, explore advanced ${topic} patterns and best practices.`,
          keyPoints: [
            "Deep dive into complex concepts",
            "Learn from real-world case studies",
            "Optimize and improve your solutions"
          ]
        }
      ],

      recommendations: {
        nextSteps: [
          "Complete the exercises in order",
          "Build a personal project using these concepts",
          "Review and reinforce weak areas"
        ],
        estimatedTime: "2-4 weeks",
        difficulty: technicalLevel.toLowerCase()
      },

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

    // Generate learning material
    const material = {
      title: `${topic} - ${technicalLevel} Learning Guide`,
      topic: topic,
      level: technicalLevel,
      style: learningStyle,
      summary: `A ${learningStyle.toLowerCase()} approach to learning ${topic} at a ${technicalLevel.toLowerCase()} level.`,

      sections: [
        {
          title: `Introduction to ${topic}`,
          content: `${topic} is an essential concept in modern technology. This guide will help you understand its fundamentals and advanced applications.`,
          keyPoints: [
            `Understand what ${topic} is and why it matters`,
            "Learn the basic terminology",
            "Get familiar with common use cases"
          ],
          examples: [
            {
              title: "Basic Example",
              description: "A simple demonstration of core concepts",
              code: `// Example of ${topic} basics\nconsole.log("Hello, ${topic}!");`
            }
          ]
        },
        {
          title: "Core Principles",
          content: `Master the fundamental principles of ${topic} that form the foundation of all advanced applications.`,
          keyPoints: [
            "Understand key principles",
            "Learn best practices",
            "Avoid common pitfalls"
          ],
          examples: [
            {
              title: "Practical Implementation",
              description: "Implementing core principles in code",
              code: `// Core principles example\nfunction example() {\n  // Implementation\n}`
            }
          ]
        },
        {
          title: "Hands-On Practice",
          content: "Apply your knowledge through practical exercises designed for your ${learningStyle} learning approach.",
          keyPoints: [
            "Complete exercises",
            "Build small projects",
            "Test your understanding"
          ],
          examples: [
            {
              title: "Practice Exercise",
              description: "Apply what you've learned",
              code: `// Practice exercise\n// Implement a function that...`
            }
          ]
        },
        {
          title: "Advanced Techniques",
          content: `Explore advanced ${topic} techniques and expert-level patterns.`,
          keyPoints: [
            "Learn advanced patterns",
            "Optimize performance",
            "Handle complex scenarios"
          ],
          examples: [
            {
              title: "Advanced Pattern",
              description: "Complex implementation example",
              code: `// Advanced pattern\nclass AdvancedExample {\n  // Implementation\n}`
            }
          ]
        }
      ]
    };

    return res.json(material);

  } catch (err) {
    console.error("❌ /generate-learning-material error:", err);
    return res.status(500).json({ error: "Learning material generation failed", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
