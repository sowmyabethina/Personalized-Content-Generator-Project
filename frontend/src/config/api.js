/**
 * API Configuration
 * Centralized API endpoints for the frontend
 */

import { getApiBaseUrl, getRagServiceBaseUrl } from "./environment.js";

const BASE_URL = getApiBaseUrl();
const RAG_SERVICE_BASE = getRagServiceBaseUrl();

// API Endpoints
const ENDPOINTS = {
  // Quiz endpoints
  QUIZ: {
    GENERATE: `${BASE_URL}/quiz/generate`,
    SCORE: `${BASE_URL}/quiz/score-quiz`,
    GENERATE_FROM_MATERIAL: `${BASE_URL}/quiz/generate-quiz-from-material`,
    PROCESS: `${BASE_URL}/api/quiz/score`
  },
  
  // PDF endpoints
  PDF: {
    READ: `${BASE_URL}/pdf/read-pdf`,
    READ_RESUME: `${BASE_URL}/pdf/read-resume-pdf`,
    GENERATE_FROM_PDF: `${BASE_URL}/pdf/generate-from-pdf`
  },
  
  // Analysis endpoints
  ANALYSIS: {
    SAVE: `${BASE_URL}/save-analysis`,
    GET_ALL: `${BASE_URL}/analyses`,
    GET_BY_ID: (id) => `${BASE_URL}/analysis/${id}`,
    UPDATE: (id) => `${BASE_URL}/analysis/${id}`,
    UPDATE_LAST_ACTIVE: (id) => `${BASE_URL}/analysis/${id}/last-active`,
    ONBOARDING_GOAL: `${BASE_URL}/onboarding/goal`,
    PROCESS: `${BASE_URL}/api/analysis/process`
  },
  
  // Learning endpoints
  LEARNING: {
    PERSONALIZED_CONTENT: `${BASE_URL}/learning/generate-personalized-content`,
    COMBINED_CONTENT: `${BASE_URL}/learning/generate-combined-content`,
    MATERIAL: `${BASE_URL}/learning/generate-learning-material`,
    QUESTIONS: `${BASE_URL}/learning/generate-learning-questions`,
    EVALUATE_STYLE: `${BASE_URL}/learning/evaluate-learning-style`,
    DOWNLOAD_PDF: `${BASE_URL}/learning/download-pdf`,
    PROCESS_MATERIAL: `${BASE_URL}/api/learning-material/process`
  },
  
  // Agent endpoints
  AGENT: {
    CHAT: `${BASE_URL}/agent/chat`,
    HEALTH: `${BASE_URL}/agent/health`,
    STUDY_PLAN: `${BASE_URL}/agent/study-plan`
  },

  // GitHub profile endpoints
  GITHUB: {
    EXTRACT_SKILLS: `${BASE_URL}/api/github/extract-skills`,
    PROCESS: `${BASE_URL}/api/github/process`
  },

  PROGRESS: {
    PROCESS: `${BASE_URL}/api/progress/process`
  },
  
  // PDF Chat endpoints (RAG service)
  PDF_CHAT: {
    HEALTH: `${RAG_SERVICE_BASE}/health`,
    UPLOAD: `${RAG_SERVICE_BASE}/upload-pdf`,
    RESET: `${RAG_SERVICE_BASE}/reset`
  },
  
  // Health check
  HEALTH: `${BASE_URL}/health`
};

export { BASE_URL, ENDPOINTS };
export default ENDPOINTS;
