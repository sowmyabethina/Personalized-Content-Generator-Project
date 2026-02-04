import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express(); // ✅ THIS WAS MISSING

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ===============================
// Generate MCQs API
// ===============================

app.post("/generate", async (req, res) => {
  const { topic, docText } = req.body;

  if (!topic && !docText) {
    return res.status(400).json({ error: "Either topic or docText is required" });
  }

  // Determine the subject matter
  const subject = docText ? `the following document content:\n${docText.substring(0, 1000)}` : `"${topic}"`;

  const prompt = `
You are an MCQ generator.

Create exactly 5 multiple choice questions on ${subject}

Rules:
1. Each question must have 4 options.
2. Only one option is correct.
3. Do NOT explain.
4. Return ONLY valid JSON.

Format:

[
  {
    "question": "Question here",
    "options": ["A","B","C","D"],
    "answer": "A"
  }
]
`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("📨 /generate - Subject:", docText ? "document" : "topic", topic || "extracted");
    console.log("RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!data.candidates) {
      return res.status(500).json({ error: "No AI response" });
    }

    let text = data.candidates[0].content.parts[0].text;

    // Clean markdown if exists
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const json = JSON.parse(text);

    res.json(json);

  } catch (err) {

    console.error("❌ BACKEND ERROR:", err);

    res.status(500).json({ error: "MCQ generation failed", details: err.message });
  }
});

// ===============================
// Start Server
// ===============================
// Minimal proxy endpoint to connect the PDF microservice running on port 3333.
// Accepts { github_url: string } and forwards a JSON-RPC call to the microservice.
app.post("/read-pdf", async (req, res) => {
  const { github_url } = req.body;

  if (!github_url) {
    return res.status(400).json({ error: "github_url is required" });
  }

  const rpcBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "read_github_pdf",
      arguments: { github_url }
    }
  };

  try {
    const upstream = await fetch("http://localhost:3333", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcBody),
    });

    const json = await upstream.json();

    if (upstream.ok && json.result) {
      return res.json(json.result);
    }

    return res.status(500).json({ error: json.error || "Upstream error" });
  } catch (err) {
    console.error("PDF proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Extract PDF and generate questions from it in a single call
app.post("/generate-from-pdf", async (req, res) => {
  const { github_url } = req.body;

  if (!github_url) {
    return res.status(400).json({ error: "github_url is required" });
  }

  const rpcBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "read_github_pdf_and_generate_questions",
      arguments: { github_url }
    }
  };

  try {
    const upstream = await fetch("http://localhost:3333", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rpcBody),
    });

    const json = await upstream.json();

    if (upstream.ok && json.result) {
      return res.json(json.result);
    }

    return res.status(500).json({ error: json.error || "Upstream error" });
  } catch (err) {
    console.error("PDF generation proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ===============================
// Personalized Quiz Generation - LEARNING STYLE ASSESSMENT
// IMPORTANT: This endpoint generates LEARNING PREFERENCE questions, NOT topic-based questions
// It assesses HOW the user prefers to learn (not WHAT they know about a topic)
// Accepts { userProfile? } and returns JSON array of learning-style questions
// Keeps existing architecture and uses the same Gemini API.
// ================================================================
app.post("/personalized-quiz", async (req, res) => {
  const { userProfile } = req.body;

  // IMPORTANT: We deliberately ignore topic and docText
  // This assessment is about learning STYLE, not about specific topics

  // Build prompt for learning-style assessment
  const profileHint = userProfile ? `User profile: ${JSON.stringify(userProfile)}\n` : "";

  const prompt = `You are an educational assessment tool that understands different learning styles.
${profileHint}
Create 5 questions to understand the user's learning preferences and style.
Each question should ask about HOW they prefer to learn, not test knowledge of a specific topic.

Example questions:
- "How do you prefer learning new technical skills?"
- "When facing a complex problem, what's your approach?"
- "What type of learning environment helps you focus best?"

Use plain JSON array format: 
[
  {
    "question": "Learning preference question here...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

Rules:
1. Each question must have 4 options
2. Do NOT test specific knowledge
3. Focus on learning preferences, study style, and educational approach
4. Do NOT include explanations
5. Return ONLY valid JSON`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [ { role: "user", parts: [{ text: prompt }] } ]
      })
    });

    const data = await response.json();
    console.log("✅ /personalized-quiz RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!data.candidates) {
      return res.status(500).json({ error: "No AI response" });
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const json = JSON.parse(text);
    return res.json(json);
  } catch (err) {
    console.error("❌ LEARNING STYLE ASSESSMENT ERROR:", err);
    return res.status(500).json({ error: "Learning assessment failed", details: err.message });
  }
});

// ===============================
// Topic Generation Endpoint
// Accepts { lastAnswers?, userProfile? } and returns suggested topics
// ================================================================
app.post("/generate-topic", async (req, res) => {
  const { lastAnswers, userProfile } = req.body;

  const hint = userProfile ? `User profile: ${JSON.stringify(userProfile)}\n` : "";
  const context = lastAnswers ? `User last answers: ${JSON.stringify(lastAnswers)}\n` : "";

  const prompt = `You are an educational assistant. Based on the following context:\n${hint}${context}Provide 3 suggested study topics (short phrases). Return ONLY a JSON array of strings.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [ { role: "user", parts: [{ text: prompt }] } ]
      })
    });

    const data = await response.json();
    console.log("/generate-topic RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!data.candidates) {
      return res.status(500).json({ error: "No AI response" });
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const json = JSON.parse(text);
    return res.json({ topics: json });
  } catch (err) {
    console.error("TOPIC GENERATION ERROR:", err);
    return res.status(500).json({ error: "Topic generation failed", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("  POST /generate");
  console.log("  POST /read-pdf");
  console.log("  POST /generate-from-pdf");
  console.log("  POST /personalized-quiz");
  console.log("  POST /generate-topic");
  console.log("API_KEY available:", !!process.env.GEMINI_API_KEY);
  console.log("Model:", process.env.GEMINI_API_KEY ? "gemini-2.5-flash" : "MISSING KEY");
});

// Handle server errors
server.on('error', (err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error("❌ Unhandled rejection:", err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error("❌ Uncaught exception:", err);
  process.exit(1);
});

// Keep process alive
console.log("Press Ctrl+C to stop server");
