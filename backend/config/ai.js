/**
 * AI Configuration
 * Groq AI client setup (LLaMA models)
 */

import "dotenv/config";
import Groq from "groq-sdk";

// Initialize Groq AI client
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

/**
 * Get a configured Groq model instance
 * @param {string} modelName - Model name to use (default: llama-3.3-70b-versatile)
 * @returns {Object} - Configured Groq client
 */
function getModel(modelName = DEFAULT_MODEL) {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return groq;
}

/**
 * Generate chat completion using Groq
 * @param {string} prompt - Prompt to send
 * @param {Object} options - Options for generation
 * @returns {Promise<string>} - Generated text response
 */
async function generateCompletion(prompt, options = {}) {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature || 0.7;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: temperature,
      response_format: { type: "json_object" }
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    // Try fallback model if primary fails
    if (model === DEFAULT_MODEL) {
      console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
      return generateCompletion(prompt, { ...options, model: FALLBACK_MODEL });
    }
    throw error;
  }
}

export { groq, getModel, generateCompletion, DEFAULT_MODEL, FALLBACK_MODEL };
export default { groq, getModel, generateCompletion, DEFAULT_MODEL, FALLBACK_MODEL };