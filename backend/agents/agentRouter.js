console.log("agentRouter.js LOADED SUCCESSFULLY");

/**
 * Agent Router - Express routes for AI Academic Study Assistant
 * 
 * Endpoints:
 * POST /agent/chat - Send message to AI assistant
 * GET /agent/health - Health check
 */

import express from 'express';
import { processMessage, getStatus } from './agentService.js';
import { generateStudyPlan } from './tools/studyPlannerTool.js';

console.log("🤖 [AGENT] Agent Router module loaded - initializing routes");

const router = express.Router();

/**
 * GET /agent/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  console.log("📍 [AGENT] GET /agent/health - Health check hit");
  
  const status = getStatus();
  
  console.log("📍 [AGENT] Health check returning:", JSON.stringify(status));
  
  res.json(status);
});

/**
 * POST /agent/chat
 * Chat with AI Academic Study Assistant
 */
router.post('/chat', async (req, res) => {
  console.log("📍 [AGENT] POST /agent/chat - Chat endpoint hit");
  console.log("📍 [AGENT] Request body:", JSON.stringify(req.body));
  
  const { message, userId } = req.body;
  
  // Validate message
  if (!message || typeof message !== 'string') {
    console.log("⚠️ [AGENT] Invalid message received");
    return res.status(400).json({
      success: false,
      error: 'Message is required',
      message: 'Please provide a message to chat'
    });
  }
  
  // Validate message length
  if (message.length > 2000) {
    console.log("⚠️ [AGENT] Message too long:", message.length);
    return res.status(400).json({
      success: false,
      error: 'Message too long',
      message: 'Message must be less than 2000 characters'
    });
  }
  
  try {
    console.log("📍 [AGENT] Calling agent service with message:", message.substring(0, 50) + "...");
    
    // Call the service
    const response = await processMessage(message, userId);
    
    console.log("📍 [AGENT] Service response success:", response.success, "isFallback:", response.isFallback);
    
    // Return response
    return res.json(response);
    
  } catch (error) {
    console.error("❌ [AGENT] Chat endpoint error:", error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

/**
 * POST /agent/study-plan
 * Generate personalized study plan based on quiz performance
 */
router.post('/study-plan', async (req, res) => {
  console.log("📍 [AGENT] POST /agent/study-plan - Study plan endpoint hit");
  console.log("📍 [AGENT] Request body:", JSON.stringify(req.body));
  
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
      message: 'Please provide a userId to generate study plan'
    });
  }
  
  try {
    const result = await generateStudyPlan(userId);
    return res.json(result);
  } catch (error) {
    console.error("❌ [AGENT] Study plan error:", error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred.'
    });
  }
});

console.log("🤖 [AGENT] Router export ready, routes defined:");
console.log("   GET  /agent/health");
console.log("   POST /agent/chat");
console.log("   POST /agent/study-plan");

export default router;
