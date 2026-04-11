import ENDPOINTS from "../../config/api";
import { requestJson } from "../../utils/http";
import { convertSectionsToLessons } from "../../utils/learning/materialProcessingFallback";

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

export const generatePersonalizedContent = async (topic, userId, profile) =>
  requestJson(
    ENDPOINTS.AGENT.CHAT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Generate personalized learning content on topic: ${topic}`,
        userId,
        context: {
          userProfile: profile,
        },
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
