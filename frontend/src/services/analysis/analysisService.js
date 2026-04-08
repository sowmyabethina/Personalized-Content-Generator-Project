import ENDPOINTS from "../../config/api";
import { requestJson } from "../api/http";
import { sortAnalysesByNewest } from "../../utils/analysis/analysisHelpers";

export const fetchAnalyses = async (userId) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const payload = await requestJson(
    `${ENDPOINTS.ANALYSIS.GET_ALL}${query}`,
    undefined,
    "Failed to load learning progress."
  );

  return sortAnalysesByNewest(payload?.analyses || []);
};

export const fetchAnalysisById = async (analysisId) =>
  requestJson(
    ENDPOINTS.ANALYSIS.GET_BY_ID(analysisId),
    undefined,
    "Failed to load analysis details."
  );

export const saveAnalysis = async (analysisData) =>
  requestJson(
    ENDPOINTS.ANALYSIS.SAVE,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analysisData),
    },
    "Failed to save analysis."
  );

export const updateAnalysis = async (analysisId, analysisData) =>
  requestJson(
    ENDPOINTS.ANALYSIS.UPDATE(analysisId),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analysisData),
    },
    "Failed to update analysis."
  );

export const processResult = async (payload) => {
  try {
    return await requestJson(
      ENDPOINTS.ANALYSIS.PROCESS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "Failed to process result."
    );
  } catch (error) {
    const {
      resultData,
      userContext,
      contentData,
      roadmapData,
    } = payload;

    return {
      analysisData: {
        userId: userContext.userId || "anonymous",
        sourceType: userContext.sourceType || "resume",
        sourceUrl: userContext.sourceUrl || null,
        extractedText: userContext.extractedText || null,
        skills: userContext.skills || [],
        strengths: userContext.strengths || [],
        weakAreas: userContext.weakAreas || [],
        aiRecommendations: contentData?.resources || contentData?.tips || [],
        learningRoadmap: roadmapData || contentData?.learningPath || null,
        technicalLevel: resultData.technicalLevel,
        learningStyle: resultData.learningStyle,
        overallScore: resultData.technicalScore || resultData.score || 0,
        topic: resultData.topic || null,
        learningScore: resultData.learningScore || null,
        technicalScore: resultData.technicalScore || resultData.score || null,
        psychometricProfile: resultData.psychometricProfile || null,
      },
      roadmapData: roadmapData || contentData?.learningPath || null,
      fallback: true,
      fallbackError: error.message,
    };
  }
};
