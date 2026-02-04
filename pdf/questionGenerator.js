import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateQuestions(text) {
  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const trimmedText = text.substring(0, 5000);

    const prompt = `
You are an expert quiz generator.

Based ONLY on the content below, generate questions to test the learner's knowledge.

Rules:
- Do not hallucinate
- Questions must be derived from the content
- Vary difficulty levels

Content:
"""
${trimmedText}
"""

Generate:
5 multiple-choice questions (with options A-D and correct answer)
3 short answer questions
2 conceptual thinking questions

Return as plain text.
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // return as string inside questions key
    return { questions: rawText };

  } catch (err) {
    console.error("❌ Gemini Error:", err.message);
    return { questions: "Failed to generate questions" };
  }
}
