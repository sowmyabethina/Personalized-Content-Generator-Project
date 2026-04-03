/**
 * Agent Routes - Express routes for Learning Agent
 * 
 * ES Module compatible route file
 * Import this in backend/index.js:
 *   import agentRoutes from './agents/routes.js';
 *   app.use('/agent', agentRoutes);
 */

console.log("ROUTES.JS FILE LOADED BY NODE");

import express from 'express';
import { routeMessage } from './LearningAgent.js';

const router = express.Router();

console.log("🤖 Agent routes file loaded");

/**
 * GET /agent/health
 * Health check for agent service
 */
router.get('/health', (req, res) => {
  console.log("Health endpoint hit");
  
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  res.json({
    status: 'ok',
    message: "Agent service running",
    service: 'LearningAgent',
    available: hasOpenAI || hasGemini,
    models: {
      openai: hasOpenAI ? 'available' : 'not configured',
      gemini: hasGemini ? 'available' : 'not configured'
    },
    tools: ['quiz', 'rag', 'analytics']
  });
});

/**
 * POST /agent/chat
 * 
 * Intelligent chat endpoint that routes to appropriate tools
 */
router.post('/chat', async (req, res) => {
  try {
    console.log("Agent chat endpoint called");
    console.log("Request body:", req.body);
    
    const { message, userId, sessionId, model, context } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "message" field',
        message: 'Please provide a message to chat'
      });
    }

    // Validate message length
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long',
        message: 'Message must be less than 2000 characters'
      });
    }

    console.log(`🤖 Agent received: "${message}" from user: ${userId || 'anonymous'}`);

    // Route message to appropriate tool
    const response = await routeMessage({
      message,
      userId,
      sessionId,
      model: model || 'openai',
      context: context || {}
    });

    console.log(`✅ Agent response (${response.tool}):`, response.success ? 'Success' : 'Failed');

    // Return response (response.message was incorrect for routeMessage output)
    return res.json({
      success: response.success,
      tool: response.tool,
      message: response.response,
      data: response.rawData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ /agent/chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

/**
 * GET /agent/self-test
 * 
 * Debug endpoint to test all three tools
 */
router.get('/self-test', async (req, res) => {
  console.log("Self-test endpoint hit");
  
  const testMessages = [
    { key: 'analyticsTest', message: 'Show my learning progress', userId: 'debug_user' },
    { key: 'quizTest', message: 'Give me a quiz on Java', userId: 'debug_user' },
    { key: 'ragTest', message: 'Explain my uploaded PDF', userId: 'debug_user' }
  ];

  const results = {};

  for (const test of testMessages) {
    try {
      console.log(`Running self-test: ${test.key} with message: "${test.message}"`);
      const response = await routeMessage({
        message: test.message,
        userId: test.userId,
        model: 'openai'
      });
      
      results[test.key] = {
        success: response.success,
        tool: response.tool,
        message: response.message,
        error: response.error || null
      };
    } catch (error) {
      results[test.key] = {
        success: false,
        error: error.message
      };
    }
  }

  console.log("Self-test completed:", results);

  res.json({
    status: 'self-test complete',
    results: results,
    timestamp: new Date().toISOString()
  });
});

export default router;
