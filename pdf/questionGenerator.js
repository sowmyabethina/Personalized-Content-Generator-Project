import Groq from "groq-sdk";
import "dotenv/config";

// Validate API key exists
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY is not set in environment variables");
}

const groq = new Groq({ apiKey: GROQ_API_KEY });
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

export async function generateQuestions(text) {
  try {
    // Check if API key is configured
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
2. options - Array of 4 options (full text, not just letters)
3. answer - The correct answer (MUST be the full text from options, e.g., "Option A")
4. explanation - A detailed explanation of why the answer is correct (MUST be included)
5. category - The technical category (MUST be included)

🚨🚨🚨 CRITICAL EXPLANATION RULES - FOLLOW STRICTLY 🚨🚨🚨

1. NEVER say "The correct answer is" or quote the answer text
2. NEVER say "Option X is correct" or "This option is correct"
3. NEVER say "This assesses your knowledge"
4. ALWAYS explain the CONCEPT purely (what it is, how it works)
5. ALWAYS explain WHY the correct option works (the technical reasoning)
6. Do NOT repeat or quote the answer text in the explanation
7. Keep to exactly 2 sentences

📝 EXPLANATION FORMAT:
Explain the concept first, then explain why the correct option works. Don't mention which option is correct.

✅ CORRECT FORMAT:
"JWT enables secure identity exchange by embedding signed information in a token, allowing the server to verify authenticity without maintaining session state."

❌ WRONG - DO NOT USE:
"The correct answer is JWT because it securely transmits identity."
"Option A is correct because it allows stateless authentication."
"This assesses your understanding of authentication tokens."

If the PDF mentions:
📌 A Skill → Ask a concept/practical question on that skill  
📌 A Project → Ask about how it was implemented  
📌 A Tool → Ask how/why it is used  
📌 Experience → Ask role-based technical questions  
📌 Certification → Ask a question on that topic

RULES:
1. Generate exactly 10 MCQs
2. Each question must test real knowledge
3. No biography questions
4. No resume-fact questions
5. No personal references
6. Return ONLY valid JSON
7. No extra text

REQUIRED JSON FORMAT:
[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "[Explain the concept in 1 sentence]. [Explain why this works - the technical reason].",
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
        temperature: 0.7
      });
      
      let rawText = chatCompletion.choices[0]?.message?.content;
      
      if (!rawText) {
        throw new Error("Empty Groq output");
      }

      console.log("🧠 AI Text:", rawText);

      // Clean up the response - Groq often returns markdown-wrapped JSON
      rawText = rawText.trim();
      
      // Remove markdown code blocks if present
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Also handle cases where there's text before/after the JSON
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }

      const parsed = JSON.parse(rawText);
      return parsed;
    } catch (primaryError) {
      console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
      
      const fallbackCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: FALLBACK_MODEL,
        temperature: 0.7
      });
      
      let rawText = fallbackCompletion.choices[0]?.message?.content;
      if (!rawText) {
        throw new Error("Empty Groq fallback output");
      }

      console.log("🧠 Fallback AI Text:", rawText);

      rawText = rawText.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }

      return JSON.parse(rawText);
    }

  } catch (err) {
    console.error("❌ Groq Error:", err);
    throw err;
  }
}