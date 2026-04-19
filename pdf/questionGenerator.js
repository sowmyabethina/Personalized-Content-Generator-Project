import Groq from "groq-sdk";
import "dotenv/config";
import { parseJson } from "../backend/utils/jsonParser.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is not set in environment variables");
}

const groq = new Groq({ apiKey: GROQ_API_KEY });
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

function parseQuizArray(rawText, label) {
  if (!rawText || !String(rawText).trim()) {
    throw new Error(`Empty Groq output (${label})`);
  }
  console.log(`[questionGenerator] Raw AI response (${label}) length=${rawText.length}`);
  let parsed;
  try {
    parsed = parseJson(rawText);
  } catch (e) {
    console.error(`[questionGenerator] JSON parse failed (${label}):`, e.message);
    console.error("[questionGenerator] Raw snippet:", String(rawText).slice(0, 1200));
    throw e;
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`Quiz model must return a JSON array (${label})`);
  }
  console.log(`[questionGenerator] Parsed question count (${label})=${parsed.length}`);
  return parsed;
}

export async function generateQuestions(text) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured. Please set it in .env file.");
    }

    console.log("📝 Input text length:", text.length);

    if (!text || text.length < 200) {
      throw new Error("Not enough content");
    }

    const prompt = `
Your task is to convert resume/PDF content into SKILL TESTING questions.

VERY IMPORTANT - YOU MUST INCLUDE THESE FIELDS FOR EACH QUESTION:
1. question - The question text
2. options - Array of exactly 4 option strings (full text, not just letters)
3. correctAnswer - Single letter A, B, C, or D matching the correct option by position
4. explanation - Why the concept works (2 sentences; do NOT name which option is correct)
5. category - Technical category (string)

EXPLANATION RULES:
- NEVER say "The correct answer is", "Option X is correct", or quote the answer text
- Explain the concept, then why the correct approach works (no option letters)

If the PDF mentions:
📌 A Skill → Ask a concept/practical question on that skill  
📌 A Project → Ask about how it was implemented  
📌 A Tool → Ask how/why it is used  
📌 Experience → Ask role-based technical questions  
📌 Certification → Ask a question on that topic

RULES:
1. Generate exactly 10 MCQs
2. Each question must test real knowledge
3. No biography questions, no resume-fact recall, no personal references
4. Return ONLY a JSON array — no markdown fences, no commentary before or after

REQUIRED JSON FORMAT (example shape):
[
  {
    "question": "Your question here?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "A",
    "explanation": "Concept explanation. Technical reasoning.",
    "category": "Data Structures"
  }
]

CONTENT TO ANALYZE:
${text}
`;

    console.log("🚀 Sending to Groq...");

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_MODEL,
        temperature: 0.7,
      });

      const rawText = chatCompletion.choices[0]?.message?.content;
      return parseQuizArray(rawText, "primary");
    } catch (primaryError) {
      console.log("Primary model failed, trying fallback:", FALLBACK_MODEL, primaryError.message);

      const fallbackCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: FALLBACK_MODEL,
        temperature: 0.7,
      });

      const rawText = fallbackCompletion.choices[0]?.message?.content;
      return parseQuizArray(rawText, "fallback");
    }
  } catch (err) {
    console.error("❌ Groq Error:", err);
    throw err;
  }
}
