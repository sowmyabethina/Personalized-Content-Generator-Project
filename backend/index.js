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
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const prompt = `
You are an MCQ generator.

Create exactly 5 multiple choice questions on "${topic}"

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

    console.log("RAW RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    if (!data.candidates) {
      return res.status(500).json({ error: "No AI response" });
    }

    let text = data.candidates[0].content.parts[0].text;

    // Clean markdown if exists
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const json = JSON.parse(text);

    res.json(json);

  } catch (err) {

    console.error("BACKEND ERROR:", err);

    res.status(500).json({ error: "MCQ generation failed" });
  }
});

// ===============================
// Start Server
// ===============================

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
