/**
 * Study Planner Tool - Autonomous Study Planning Agent
 * 
 * Analyzes quiz performance and generates personalized study plans
 * 
 * Capabilities:
 * - Read quiz results from PostgreSQL
 * - Calculate performance metrics
 * - Generate AI-powered study recommendations
 */

import db from '../../../db/db.js';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Analyze user quiz performance and generate study plan
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Study plan and analysis
 */
export async function generateStudyPlan(userId) {
  console.log("📝 StudyPlannerTool: Generating study plan for user:", userId);
  
  try {
    // 1. Fetch quiz results for the user
    const quizResults = await getQuizResults(userId);
    
    if (!quizResults || quizResults.length === 0) {
      console.log("⚠️ No quiz results found for user");
      return {
        success: false,
        message: "No quiz results found. Take some quizzes first to get a personalized study plan!",
        analysis: null,
        studyPlan: null
      };
    }
    
    console.log("📊 Found", quizResults.length, "quiz results");
    
    // 2. Analyze performance
    const analysis = analyzePerformance(quizResults);
    console.log("📊 Analysis complete:", analysis);
    
    // 3. Generate AI study plan
    let studyPlanText = "";
    
    if (openai) {
      console.log("🤖 Calling OpenAI for study plan...");
      studyPlanText = await generateAIStudyPlan(analysis);
    } else {
      // Fallback to rule-based plan
      studyPlanText = generateRuleBasedPlan(analysis);
    }
    
    return {
      success: true,
      analysis: analysis,
      studyPlan: studyPlanText
    };
    
  } catch (error) {
    console.error("❌ StudyPlannerTool error:", error.message);
    return {
      success: false,
      message: "Error generating study plan: " + error.message,
      analysis: null,
      studyPlan: null
    };
  }
}

/**
 * Get quiz results from database
 */
async function getQuizResults(userId) {
  // Note: quizzes table doesn't have user_id, so we get all results
  // In a production app, you'd want to add user_id to quizzes table
  const query = `
    SELECT 
      qr.id,
      qr.quiz_id,
      qr.score,
      qr.correct_count,
      qr.total_count,
      qr.completed_at,
      q.topic as quiz_topic
    FROM quiz_results qr
    JOIN quizzes q ON qr.quiz_id = q.id
    ORDER BY qr.completed_at DESC
    LIMIT 20
  `;
  
  const result = await db.query(query);
  return result.rows;
}

/**
 * Analyze quiz performance
 */
function analyzePerformance(quizResults) {
  const totalQuizzes = quizResults.length;
  
  // Calculate average score
  const scores = quizResults.map(q => q.score || 0);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalQuizzes);
  
  // Group by topic
  const topicScores = {};
  quizResults.forEach(q => {
    const topic = q.quiz_topic || 'Unknown';
    if (!topicScores[topic]) {
      topicScores[topic] = [];
    }
    topicScores[topic].push(q.score || 0);
  });
  
  // Find weakest and strongest topics
  const topicAverages = {};
  Object.keys(topicScores).forEach(topic => {
    const topicScoreList = topicScores[topic];
    topicAverages[topic] = Math.round(topicScoreList.reduce((a, b) => a + b, 0) / topicScoreList.length);
  });
  
  // Sort topics by score
  const sortedTopics = Object.entries(topicAverages).sort((a, b) => a[1] - b[1]);
  
  const weakestTopics = sortedTopics.slice(0, 3).map(t => t[0]);
  const strongestTopics = sortedTopics.slice(-3).reverse().map(t => t[0]);
  
  // Calculate recent trend (last 5 quizzes)
  const recentQuizzes = quizResults.slice(0, 5);
  const recentScores = recentQuizzes.map(q => q.score || 0);
  const recentAverage = Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length);
  
  // Determine trend
  let trend = 'stable';
  if (recentAverage > averageScore + 5) {
    trend = 'improving';
  } else if (recentAverage < averageScore - 5) {
    trend = 'declining';
  }
  
  // Determine suggested difficulty
  let suggestedDifficulty = 'medium';
  if (averageScore < 50) {
    suggestedDifficulty = 'easy';
  } else if (averageScore > 80) {
    suggestedDifficulty = 'hard';
  }
  
  // Calculate recommended study hours
  const recommendedStudyHours = Math.max(1, Math.min(4, Math.ceil((100 - averageScore) / 30)));
  
  // Determine if revision is required
  const revisionRequired = averageScore < 70 || trend === 'declining';
  
  return {
    totalQuizzes,
    averageScore,
    weakestTopics,
    strongestTopics,
    recentAverage,
    trend,
    suggestedDifficulty,
    recommendedStudyHours,
    revisionRequired,
    topicPerformance: topicAverages
  };
}

/**
 * Generate AI-powered study plan
 */
async function generateAIStudyPlan(analysis) {
  const prompt = `You are a friendly study advisor. Based on the student's performance analysis, create a personalized daily study plan.

Performance Analysis:
- Average Score: ${analysis.averageScore}%
- Weakest Topics: ${analysis.weakestTopics.join(', ')}
- Strongest Topics: ${analysis.strongestTopics.join(', ')}
- Recent Trend: ${analysis.trend} (recent average: ${analysis.recentAverage}%)
- Suggested Quiz Difficulty: ${analysis.suggestedDifficulty}
- Recommended Study Hours: ${analysis.recommendedStudyHours} hours
- Revision Required: ${analysis.revisionRequired ? 'Yes' : 'No'}

Write a friendly, encouraging study plan (2-3 sentences) that:
1. Acknowledges their progress
2. Identifies what to focus on today
3. Gives specific actionable recommendations

Keep it conversational and motivating!`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful study advisor." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    return completion.choices[0]?.message?.content || generateRuleBasedPlan(analysis);
  } catch (error) {
    console.error("❌ OpenAI error:", error.message);
    return generateRuleBasedPlan(analysis);
  }
}

/**
 * Generate rule-based study plan (fallback)
 */
function generateRuleBasedPlan(analysis) {
  let plan = `Based on your quiz performance (${analysis.averageScore}% average), `;
  
  if (analysis.revisionRequired) {
    plan += `you should focus on revision today. Your weakest areas are: ${analysis.weakestTopics.join(', ')}. `;
  } else {
    plan += `great progress! You're doing well in ${analysis.strongestTopics[0] || 'your strong topics'}. `;
  }
  
  if (analysis.trend === 'improving') {
    plan += `Keep up the good work! Your scores are improving. `;
  } else if (analysis.trend === 'declining') {
    plan += `Your recent performance has been declining. Consider reviewing the material again. `;
  }
  
  plan += `Today, aim to study for ${analysis.recommendedStudyHours} hour(s) and try a ${analysis.suggestedDifficulty} difficulty quiz to test your knowledge.`;
  
  return plan;
}

/**
 * Tool schema for LLM function calling
 */
export const studyPlannerToolSchema = {
  name: 'studyPlannerTool',
  description: 'Generate a personalized study plan based on quiz performance. Use this when user asks for study recommendations, learning plan, what to revise, or how to improve.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'The user ID to generate study plan for'
      }
    },
    required: ['userId']
  }
};

export default { generateStudyPlan, studyPlannerToolSchema };
