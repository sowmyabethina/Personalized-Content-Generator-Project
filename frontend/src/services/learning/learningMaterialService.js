import ENDPOINTS from "../../config/api";
import { requestJson } from "../../utils/http";
import { convertSectionsToLessons } from "../../utils/learning/materialProcessingFallback";

function toApiTechnicalLevel(level) {
  const s = String(level || "").toLowerCase();
  if (s.includes("advanced")) return "advanced";
  if (s.includes("beginner")) return "beginner";
  return "intermediate";
}

function toApiLearningStyle(style) {
  const s = String(style || "").toLowerCase();
  if (s.includes("hands") || s.includes("kinesthetic")) return "kinesthetic";
  if (s.includes("visual")) return "visual";
  if (s.includes("auditory")) return "auditory";
  return "reading";
}

export const generateLearningMaterial = async (topic, technicalLevel, learningStyle) =>
  requestJson(
    ENDPOINTS.LEARNING.MATERIAL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, technicalLevel, learningStyle }),
    },
    "Failed to generate learning material."
  );

/**
 * Loads combined personalized path directly from the learning API (avoids agent misrouting).
 */
export const generatePersonalizedContent = async (topic, userId, profile = {}) =>
  requestJson(
    ENDPOINTS.LEARNING.COMBINED_CONTENT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic || "General Technology",
        technicalLevel: toApiTechnicalLevel(profile.technicalLevel),
        learningStyle: toApiLearningStyle(profile.learningStyle),
        technicalScore: profile.technicalScore ?? 50,
        learningScore: profile.learningScore ?? 50,
        combinedAnalysis: "",
        userId,
      }),
    },
    "Failed to generate personalized content."
  );

export const fetchLearningQuestions = async () =>
  requestJson(
    ENDPOINTS.LEARNING.QUESTIONS,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
    "Failed to load learning questions."
  );

export const processMaterial = async (learningMaterial, context = {}) => {
  try {
    return await requestJson(
      ENDPOINTS.LEARNING.PROCESS_MATERIAL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningMaterial, ...context }),
      },
      "Failed to process learning material."
    );
  } catch (error) {
    return {
      lessons: convertSectionsToLessons(learningMaterial),
      fallback: true,
      fallbackError: error.message,
    };
  }
};
