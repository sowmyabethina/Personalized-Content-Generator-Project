/**
 * Analytics Tool - Reads user performance from PostgreSQL
 * Queries: quiz_results and user_analyses tables
 */

import db from '../../../db/db.js';

/**
 * Get user analytics from database
 * @param {Object} params - Analytics parameters
 * @param {string} params.userId - User ID to get analytics for
 * @param {string} params.analysisId - Specific analysis ID (optional)
 * @returns {Promise<Object>} User performance data
 */
export async function analyticsTool({ userId, analysisId }) {
  try {
    let query;
    let params;
    
    if (analysisId) {
      // Get specific analysis
      query = `
        SELECT 
          id, user_id, source_type, technical_level, learning_style,
          overall_score, topic, learning_score, technical_score,
          psychometric_profile, career_goal, onboarding_completed,
          experience_level, created_at, updated_at
        FROM user_analyses 
        WHERE id = $1
      `;
      params = [analysisId];
    } else if (userId) {
      // Get all analyses for user
      query = `
        SELECT 
          id, user_id, source_type, technical_level, learning_style,
          overall_score, topic, learning_score, technical_score,
          psychometric_profile, career_goal, onboarding_completed,
          experience_level, created_at, updated_at
        FROM user_analyses 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      params = [userId];
    } else {
      // Get all analyses (for demo/anonymous)
      query = `
        SELECT 
          id, user_id, source_type, technical_level, learning_style,
          overall_score, topic, learning_score, technical_score,
          psychometric_profile, career_goal, onboarding_completed,
          experience_level, created_at, updated_at
        FROM user_analyses 
        ORDER BY created_at DESC
        LIMIT 10
      `;
      params = [];
    }
    
    const result = await db.query(query, params);
    
    // Get quiz results if userId provided
    let quizResults = [];
    if (userId) {
      const quizQuery = `
        SELECT 
          qr.id, qr.quiz_id, qr.score, qr.correct_count, qr.total_count,
          qr.user_answers, qr.completed_at,
          q.topic as quiz_topic
        FROM quiz_results qr
        JOIN quizzes q ON qr.quiz_id = q.id
        WHERE q.id IN (
          SELECT id FROM quizzes WHERE user_id = $1 OR user_id IS NULL
        )
        ORDER BY qr.completed_at DESC
        LIMIT 20
      `;
      const quizResult = await db.query(quizQuery, [userId]);
      quizResults = quizResult.rows;
    }
    
    // Calculate summary stats
    const analyses = result.rows;
    const totalQuizzes = quizResults.length;
    const avgScore = totalQuizzes > 0 
      ? Math.round(quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / totalQuizzes)
      : 0;
    
    return {
      success: true,
      tool: 'analytics',
      data: {
        analyses: analyses.map(a => ({
          id: a.id,
          sourceType: a.source_type,
          technicalLevel: a.technical_level,
          learningStyle: a.learning_style,
          overallScore: a.overall_score,
          topic: a.topic,
          learningScore: a.learning_score,
          technicalScore: a.technical_score,
          careerGoal: a.career_goal,
          experienceLevel: a.experience_level,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        })),
        quizResults: quizResults.map(q => ({
          id: q.id,
          quizId: q.quiz_id,
          quizTopic: q.quiz_topic,
          score: q.score,
          correctCount: q.correct_count,
          totalCount: q.total_count,
          completedAt: q.completed_at
        })),
        summary: {
          totalAnalyses: analyses.length,
          totalQuizzes,
          averageScore: avgScore,
          latestAnalysis: analyses[0] || null
        }
      },
      message: `Retrieved analytics: ${analyses.length} analyses, ${totalQuizzes} quiz results`
    };
  } catch (error) {
    console.error('❌ Analytics tool error:', error.message);
    return {
      success: false,
      tool: 'analytics',
      error: error.message,
      message: 'Failed to retrieve analytics'
    };
  }
}

/**
 * Get learning progress over time
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Progress data
 */
export async function getLearningProgress(userId) {
  try {
    const query = `
      SELECT 
        DATE(qr.completed_at) as date,
        AVG(qr.score) as avg_score,
        COUNT(*) as quiz_count,
        SUM(qr.correct_count) as total_correct,
        SUM(qr.total_count) as total_questions
      FROM quiz_results qr
      WHERE qr.quiz_id IN (
        SELECT id FROM quizzes WHERE user_id = $1 OR user_id IS NULL
      )
      AND qr.completed_at IS NOT NULL
      GROUP BY DATE(qr.completed_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const result = await db.query(query, [userId]);
    
    return {
      success: true,
      tool: 'analytics',
      data: {
        progress: result.rows.map(r => ({
          date: r.date,
          avgScore: Math.round(r.avg_score || 0),
          quizCount: parseInt(r.quiz_count),
          totalCorrect: parseInt(r.total_correct),
          totalQuestions: parseInt(r.total_questions)
        }))
      },
      message: 'Retrieved learning progress data'
    };
  } catch (error) {
    console.error('❌ Learning progress tool error:', error.message);
    return {
      success: false,
      tool: 'analytics',
      error: error.message,
      message: 'Failed to retrieve learning progress'
    };
  }
}

/**
 * Tool schema for LLM function calling
 */
export const analyticsToolSchema = {
  name: 'analyticsTool',
  description: 'Retrieve user learning analytics, progress, quiz history, and performance data. Use this when user wants to see their learning progress, quiz scores, strengths, weaknesses, or any information about their learning journey.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to get analytics for'
      },
      analysisId: {
        type: 'string',
        description: 'Optional specific analysis ID to retrieve'
      }
    }
  }
};
