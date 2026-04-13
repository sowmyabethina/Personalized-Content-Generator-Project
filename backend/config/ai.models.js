/**
 * Default Groq model ids (override via env without code changes).
 */
export const GROQ_MODEL_PRIMARY =
  process.env.GROQ_MODEL_PRIMARY || "llama-3.3-70b-versatile";
export const GROQ_MODEL_FALLBACK =
  process.env.GROQ_MODEL_FALLBACK || "llama-3.1-8b-instant";
