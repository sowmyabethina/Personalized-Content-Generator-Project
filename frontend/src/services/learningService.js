/**
 * Learning Service
 * API calls for learning pages
 */

import ENDPOINTS from '../config/api';

/**
 * Generate learning material
 * @param {string} topic - Topic
 * @param {string} technicalLevel - Technical level
 * @param {string} learningStyle - Learning style
 * @returns {Promise<Object>} - Learning material
 */
export const generateLearningMaterial = async (topic, technicalLevel, learningStyle) => {
  const res = await fetch(ENDPOINTS.LEARNING.MATERIAL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, technicalLevel, learningStyle })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate material');
  }
  
  return res.json();
};

/**
 * Generate personalized content
 * @param {string} topic - Topic
 * @param {string} learningStyle - Learning style
 * @param {string} technicalLevel - Technical level
 * @returns {Promise<Object>} - Content object
 */
export const generatePersonalizedContent = async (topic, learningStyle, technicalLevel) => {
  const res = await fetch(ENDPOINTS.LEARNING.PERSONALIZED_CONTENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, styleId: learningStyle, technicalLevel })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate content');
  }
  
  return res.json();
};

/**
 * Generate combined content
 * @param {string} topic - Topic
 * @param {string} technicalLevel - Technical level
 * @param {number} technicalScore - Technical score
 * @param {string} learningStyle - Learning style
 * @param {number} learningScore - Learning score
 * @returns {Promise<Object>} - Content object
 */
export const generateCombinedContent = async (topic, technicalLevel, technicalScore, learningStyle, learningScore) => {
  const res = await fetch(ENDPOINTS.LEARNING.COMBINED_CONTENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      technicalLevel,
      technicalScore,
      learningStyle,
      learningScore
    })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate content');
  }
  
  return res.json();
};

/**
 * Fetch all analyses for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Analyses array
 */
export const fetchAnalyses = async (userId = '') => {
  const url = userId 
    ? `${ENDPOINTS.ANALYSIS.GET_ALL}?userId=${encodeURIComponent(userId)}`
    : ENDPOINTS.ANALYSIS.GET_ALL;
    
  const res = await fetch(url);
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch analyses');
  }
  
  const data = await res.json();
  return data.analyses || [];
};

/**
 * Get analysis by ID
 * @param {string} id - Analysis ID
 * @returns {Promise<Object>} - Analysis object
 */
export const getAnalysisById = async (id) => {
  const res = await fetch(ENDPOINTS.ANALYSIS.GET_BY_ID(id));
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Analysis not found');
  }
  
  const data = await res.json();
  return data.analysis;
};

/**
 * Save analysis
 * @param {Object} analysisData - Analysis data
 * @returns {Promise<Object>} - Result with ID
 */
export const saveAnalysis = async (analysisData) => {
  const res = await fetch(ENDPOINTS.ANALYSIS.SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisData)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save analysis');
  }
  
  return res.json();
};

/**
 * Update analysis
 * @param {string} id - Analysis ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Result
 */
export const updateAnalysis = async (id, updateData) => {
  const res = await fetch(ENDPOINTS.ANALYSIS.UPDATE(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update analysis');
  }
  
  return res.json();
};

/**
 * Update last active timestamp
 * @param {string} id - Analysis ID
 * @returns {Promise<void>}
 */
export const updateLastActive = async (id) => {
  const res = await fetch(ENDPOINTS.ANALYSIS.UPDATE_LAST_ACTIVE(id), {
    method: 'PATCH'
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update last active timestamp');
  }
  
  return res.json();
};

/**
 * Save onboarding goal
 * @param {string} userId - User ID
 * @param {string} careerGoal - Career goal
 * @param {string} experienceLevel - Experience level
 * @returns {Promise<Object>} - Result
 */
export const saveOnboardingGoal = async (userId, careerGoal, experienceLevel) => {
  const res = await fetch(ENDPOINTS.ANALYSIS.ONBOARDING_GOAL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, careerGoal, experienceLevel })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save goal');
  }
  
  return res.json();
};

/**
 * Download learning material as PDF
 * @param {string} content - Content to convert
 * @param {string} filename - Filename
 * @returns {Promise<void>}
 */
export const downloadMaterialPdf = async (content, filename) => {
  const res = await fetch(ENDPOINTS.LEARNING.DOWNLOAD_PDF, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate PDF');
  }
  
  // Response is a blob for download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(filename || 'learning-material').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Evaluate learning style
 * @param {Array} answers - User answers
 * @param {string} topic - Topic
 * @returns {Promise<Object>} - Evaluation result
 */
export const evaluateLearningStyle = async (answers, topic) => {
  const res = await fetch(ENDPOINTS.LEARNING.EVALUATE_STYLE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, topic })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to evaluate learning style');
  }
  
  return res.json();
};