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

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
