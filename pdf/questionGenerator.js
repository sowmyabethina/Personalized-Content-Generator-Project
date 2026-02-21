import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateQuestions(text) {
  try {

    console.log("📝 Input text length:", text.length);

    if (!text || text.length < 200) {
      throw new Error("Not enough content");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    console.log("🚀 Sending to Gemini...");

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    if (!rawText) {
      throw new Error("Empty Gemini output");
    }

    console.log("🧠 AI Text:", rawText);

    // Clean up the response - Gemini 2.5 often returns markdown-wrapped JSON
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

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ JSON Parse Failed");
      console.error("RAW OUTPUT:\n", rawText);
      throw new Error("Invalid JSON from Gemini");
    }

    return parsed;

  } catch (err) {
    console.error("❌ Gemini Error:", err);
    throw err;
  }
}