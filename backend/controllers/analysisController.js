/**
 * Analysis Controller
 * Handles analysis route logic (req/res handling)
 * 
 * MUST be thin - ONLY receives req/res, calls services, returns response
 */

const {
  saveUserAnalysis,
  updateUserAnalysis,
  getUserAnalysis,
  getUserAnalyses,
  updateLastActive,
  saveOnboardingGoal
} = require('../services/analysisService');
const { db } = require('../config/database');
const { handleError } = require('../utils/errorHandler');
const { log } = require('../utils/logger');

/**
 * Save analysis - handles /save-analysis
 * Expects: analysis data object
 */
async function saveAnalysis(req, res) {
  try {
    const {
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
    } = req.body;

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await saveUserAnalysis({
      id: analysisId,
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
    });

    if (result.success) {
      return res.json({
        success: true,
        analysisId,
        message: 'Analysis saved successfully'
      });
    }
    
    return res.status(500).json({ error: 'Failed to save analysis', details: result.error });
    
  } catch (err) {
    const errorResponse = handleError(err, '/save-analysis');
    return res.status(500).json({ error: 'Analysis save failed', details: errorResponse.message });
  }
}

/**
 * Get all analyses - handles /analyses
 * Query params: userId?
 */
async function getAnalyses(req, res) {
  try {
    const { userId } = req.query;
    
    const analyses = await getUserAnalyses(userId);
    
    return res.json({
      success: true,
      analyses,
      count: analyses.length
    });
    
  } catch (err) {
    const errorResponse = handleError(err, '/analyses');
    return res.status(500).json({ error: 'Failed to fetch analyses', details: errorResponse.message });
  }
}

/**
 * Get analysis by ID - handles /analysis/:id
 */
async function getAnalysisById(req, res) {
  try {
    const { id } = req.params;
    
    const analysis = await getUserAnalysis(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    return res.json({
      success: true,
      analysis
    });
    
  } catch (err) {
    const errorResponse = handleError(err, '/analysis/:id');
    return res.status(500).json({ error: 'Failed to fetch analysis', details: errorResponse.message });
  }
}

/**
 * Update analysis - handles /analysis/:id (PUT)
 */
async function updateAnalysis(req, res) {
  try {
    const { id } = req.params;
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
    } = req.body;

    const result = await updateUserAnalysis(id, {
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
    });

    if (result.success) {
      return res.json({
        success: true,
        analysisId: id,
        message: 'Analysis updated successfully'
      });
    }
    
    return res.status(404).json({ error: result.error || 'Failed to update analysis' });
    
  } catch (err) {
    const errorResponse = handleError(err, '/analysis/:id PUT');
    return res.status(500).json({ error: 'Analysis update failed', details: errorResponse.message });
  }
}

/**
 * Update last active - handles /analysis/:id/last-active (PATCH)
 */
async function updateLastActiveHandler(req, res) {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `UPDATE user_analyses SET updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.json({ success: true, message: 'Last active updated' });
    
  } catch (err) {
    const errorResponse = handleError(err, '/analysis/:id/last-active');
    return res.status(500).json({ error: 'Failed to update last active', details: errorResponse.message });
  }
}

/**
 * Save onboarding goal - handles /onboarding/goal
 * Expects: { userId, careerGoal, experienceLevel? }
 */
async function saveOnboardingGoalHandler(req, res) {
  try {
    const { userId, careerGoal, experienceLevel } = req.body;
    
    if (!userId || !careerGoal) {
      return res.status(400).json({ error: 'userId and careerGoal are required' });
    }
    
    const result = await saveOnboardingGoal(userId, careerGoal, experienceLevel);
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'Onboarding goal saved',
        analysisId: result.analysisId
      });
    }
    
    return res.status(500).json({ error: 'Failed to save goal', details: result.error });
    
  } catch (err) {
    const errorResponse = handleError(err, '/onboarding/goal');
    return res.status(500).json({ error: 'Failed to save goal', details: errorResponse.message });
  }
}

module.exports = {
  saveAnalysis,
  getAnalyses,
  getAnalysisById,
  updateAnalysis,
  updateLastActiveHandler,
  saveOnboardingGoalHandler
};