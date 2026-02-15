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
You are an expert technical interviewer.

Your task is to convert resume/PDF content into SKILL TESTING questions.

VERY IMPORTANT:

You are NOT allowed to ask questions about:

❌ NEVER create questions like:

These are FORBIDDEN.


You MUST do this instead:

If PDF mentions:

📌 A Skill → Ask a concept/practical question on that skill  
📌 A Project → Ask about how it was implemented  
📌 A Tool → Ask how/why it is used  
📌 Experience → Ask role-based technical questions  
📌 Certification → Ask a question on that topic (NOT about certificate)

Examples:

If PDF says "Python":
✅ Ask: "Which data structure is best for fast lookups in Python?"

If PDF says "React Project":
✅ Ask: "Why is useEffect used in React applications?"

If PDF says "MongoDB":
✅ Ask: "What is indexing in MongoDB and why is it used?"

If PDF says "Git":
✅ Ask: "What is the purpose of git rebase?"


RULES:

1. Generate exactly 10 MCQs
2. Each question must test real knowledge
3. No biography questions
4. No resume-fact questions
5. No personal references
6. Return ONLY valid JSON
7. No extra text

FORMAT:

[
  {
    "question": "...",
    "options": ["A","B","C","D"],
    "answer": "A"
  }
]

CONTENT:
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