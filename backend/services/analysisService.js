/**
 * Analysis Service
 * Handles analysis database operations
 */

const { db } = require('../config/database');
const { logError, logSuccess } = require('../utils/logger');

/**
 * Save user analysis
 * @param {Object} analysisData - Analysis data object
 * @returns {Object} - Result with success status
 */
async function saveUserAnalysis(analysisData) {
  try {
    const {
      id,
      userId,
      sourceType,
      sourceUrl,
      extractedText,
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      overallScore
    } = analysisData;

    await db.query(
      `INSERT INTO user_analyses 
       (id, user_id, source_type, source_url, extracted_text, skills, strengths, weak_areas, 
        ai_recommendations, learning_roadmap, technical_level, learning_style, overall_score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
        extracted_text = COALESCE($5, user_analyses.extracted_text),
        skills = COALESCE($6, user_analyses.skills),
        strengths = COALESCE($7, user_analyses.strengths),
        weak_areas = COALESCE($8, user_analyses.weak_areas),
        ai_recommendations = COALESCE($9, user_analyses.ai_recommendations),
        learning_roadmap = COALESCE($10, user_analyses.learning_roadmap),
        technical_level = COALESCE($11, user_analyses.technical_level),
        learning_style = COALESCE($12, user_analyses.learning_style),
        overall_score = COALESCE($13, user_analyses.overall_score),
        updated_at = NOW()`,
      [id, userId || null, sourceType, sourceUrl || null, extractedText || null, 
       JSON.stringify(skills || []), JSON.stringify(strengths || []), JSON.stringify(weakAreas || []),
       JSON.stringify(aiRecommendations || []), JSON.stringify(learningRoadmap || null),
       technicalLevel || null, learningStyle || null, overallScore || null]
    );

    logSuccess(`User analysis saved: ${id}`);
    return { success: true, analysisId: id };
  } catch (err) {
    logError('Error saving user analysis', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update user analysis
 * @param {string} analysisId - Analysis ID
 * @param {Object} updateData - Data to update
 * @returns {Object} - Result with success status
 */
async function updateUserAnalysis(analysisId, updateData) {
  try {
    const {
      skills,
      strengths,
      weakAreas,
      aiRecommendations,
      learningRoadmap,
      technicalLevel,
      learningStyle,
      topic,
      learningScore,
      technicalScore,
      psychometricProfile
    } = updateData;

    const result = await db.query(
      `UPDATE user_analyses SET
        skills = COALESCE($2, skills),
        strengths = COALESCE($3, strengths),
        weak_areas = COALESCE($4, weak_areas),
        ai_recommendations = COALESCE($5, ai_recommendations),
        learning_roadmap = COALESCE($6, learning_roadmap),
        technical_level = COALESCE($7, technical_level),
        learning_style = COALESCE($8, learning_style),
        topic = COALESCE($9, topic),
        learning_score = COALESCE($10, learning_score),
        technical_score = COALESCE($11, technical_score),
        psychometric_profile = COALESCE($12, psychometric_profile),
        updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [analysisId,
       JSON.stringify(skills || null),
       JSON.stringify(strengths || null),
       JSON.stringify(weakAreas || null),
       JSON.stringify(aiRecommendations || null),
       JSON.stringify(learningRoadmap || null),
       technicalLevel || null,
       learningStyle || null,
       topic || null,
       learningScore || null,
       technicalScore || null,
       JSON.stringify(psychometricProfile || null)]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Analysis not found' };
    }

    logSuccess(`User analysis updated: ${analysisId}`);
    return { success: true, analysisId };
  } catch (err) {
    logError('Error updating user analysis', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get user analysis by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Object|null} - Analysis data or null
 */
async function getUserAnalysis(analysisId) {
  try {
    const result = await db.query(
      `SELECT id, user_id, source_type, source_url, extracted_text, skills, strengths, weak_areas,
              ai_recommendations, learning_roadmap, technical_level, learning_style, overall_score,
              topic, learning_score, technical_score, psychometric_profile,
              created_at, updated_at
       FROM user_analyses WHERE id = $1`,
      [analysisId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      extractedText: row.extracted_text,
      skills: row.skills,
      strengths: row.strengths,
      weakAreas: row.weak_areas,
      aiRecommendations: row.ai_recommendations,
      learningRoadmap: row.learning_roadmap,
      technicalLevel: row.technical_level,
      learningStyle: row.learning_style,
      overallScore: row.overall_score,
      topic: row.topic,
      learningScore: row.learning_score,
      technicalScore: row.technical_score,
      psychometricProfile: row.psychometric_profile,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (err) {
    logError('Error getting user analysis', err);
    return null;
  }
}

/**
 * Get all user analyses
 * @param {string} userId - User ID (optional)
 * @returns {Array} - Array of analyses
 */
async function getUserAnalyses(userId) {
  try {
    let query;
    let params;
    
    if (userId) {
      query = `SELECT id, user_id, source_type, source_url, technical_level, learning_style, overall_score,
               topic, learning_score, technical_score, psychometric_profile,
               career_goal, onboarding_completed, experience_level,
               learning_roadmap,
               created_at, updated_at
        FROM user_analyses 
        WHERE user_id = $1
        ORDER BY created_at DESC`;
      params = [userId];
    } else {
      query = `SELECT id, user_id, source_type, source_url, technical_level, learning_style, overall_score,
               topic, learning_score, technical_score, psychometric_profile,
               career_goal, onboarding_completed, experience_level,
               learning_roadmap,
               created_at, updated_at
        FROM user_analyses 
        ORDER BY created_at DESC`;
      params = [];
    }
    
    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      technicalLevel: row.technical_level,
      learningStyle: row.learning_style,
      overallScore: row.overall_score,
      topic: row.topic,
      learningScore: row.learning_score,
      technicalScore: row.technical_score,
      psychometricProfile: row.psychometric_profile,
      careerGoal: row.career_goal,
      onboardingCompleted: row.onboarding_completed,
      experienceLevel: row.experience_level,
      learningRoadmap: row.learning_roadmap,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    logError('Error getting user analyses', err);
    return [];
  }
}

/**
 * Update last active timestamp
 * @param {string} analysisId - Analysis ID
 * @returns {boolean} - Success status
 */
async function updateLastActive(analysisId) {
  try {
    const result = await db.query(
      `UPDATE user_analyses SET updated_at = NOW() WHERE id = $1 RETURNING id`,
      [analysisId]
    );

    return result.rows.length > 0;
  } catch (err) {
    logError('Error updating last active', err);
    return false;
  }
}

/**
 * Save onboarding goal
 * @param {string} userId - User ID
 * @param {string} careerGoal - Career goal
 * @param {string} experienceLevel - Experience level
 * @returns {Object} - Result with analysisId
 */
async function saveOnboardingGoal(userId, careerGoal, experienceLevel) {
  try {
    const existingAnalyses = await getUserAnalyses(userId);
    
    if (existingAnalyses && existingAnalyses.length > 0) {
      const analysisId = existingAnalyses[0].id;
      await db.query(
        `UPDATE user_analyses 
         SET career_goal = $1, goal = $1, experience_level = $2, onboarding_completed = TRUE, updated_at = NOW()
         WHERE id = $3`,
        [careerGoal, experienceLevel || null, analysisId]
      );
      
      return { success: true, analysisId };
    } else {
      const analysisId = `onboarding_${userId}_${Date.now()}`;
      await db.query(
        `INSERT INTO user_analyses 
         (id, user_id, career_goal, goal, experience_level, onboarding_completed, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, TRUE, NOW(), NOW())`,
        [analysisId, userId, careerGoal, experienceLevel || null]
      );
      
      return { success: true, analysisId };
    }
  } catch (err) {
    logError('Error saving onboarding goal', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  saveUserAnalysis,
  updateUserAnalysis,
  getUserAnalysis,
  getUserAnalyses,
  updateLastActive,
  saveOnboardingGoal
};