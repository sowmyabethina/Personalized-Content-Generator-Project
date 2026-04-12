/**
 * RAG Tool - Interfaces with the RAG PDF Service for chat
 * Calls: POST http://localhost:5001/chat
 * Includes caching for repeated queries
 */

import axios from 'axios';
import { getRagServiceUrl } from '../../config/app.config.js';

const RAG_SERVICE_URL = getRagServiceUrl();

// Simple in-memory cache for chat responses
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

/**
 * Generate cache key from message and session
 */
function getCacheKey(message, sessionId) {
  return `${sessionId || 'default'}:${message.substring(0, 100)}`;
}

/**
 * Get cached response if valid
 */
function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("💾 Cache hit:", cacheKey.substring(0, 50));
    return cached.data;
  }
  return null;
}

/**
 * Cache a response
 */
function setCachedResponse(cacheKey, data) {
  // Clean up old entries if cache is full
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Chat with PDF using RAG (with caching)
 * @param {Object} params - Chat parameters
 * @param {string} params.message - The user's question about the PDF
 * @param {string} params.sessionId - Session ID for conversation context
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<Object>} RAG response
 */
export async function ragTool({ message, sessionId, userId }) {
  const cacheKey = getCacheKey(message, sessionId);
  
  // Check cache first
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      cached: true
    };
  }
  
  try {
    console.log("🤖 RAG tool: Calling PDF service...");
    const response = await axios.post(`${RAG_SERVICE_URL}/chat`, {
      question: message,
      sessionId: sessionId || `agent_${Date.now()}`,
      userId
    }, {
      timeout: 90000, // 90 second timeout for RAG operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = {
      success: true,
      tool: 'rag',
      data: response.data,
      message: 'Retrieved information from your PDF'
    };
    
    // Cache the successful response
    setCachedResponse(cacheKey, result);

    return result;
  } catch (error) {
    console.error('❌ RAG tool error:', error.message);
    
    // Check if no PDF is uploaded
    if (error.response?.status === 400 && error.response?.data?.error?.includes('No PDF')) {
      return {
        success: false,
        tool: 'rag',
        error: 'No PDF uploaded yet. Please upload a PDF first before asking questions.',
        message: 'No PDF available for chat'
      };
    }
    
    return {
      success: false,
      tool: 'rag',
      error: error.response?.data?.error || error.message,
      message: 'Failed to get response from PDF'
    };
  }
}

/**
 * Check if PDF is uploaded to RAG service
 * @returns {Promise<Object>} PDF status
 */
export async function checkPdfStatus() {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    return {
      success: true,
      pdfLoaded: response.data?.pdfLoaded || false,
      chunkCount: response.data?.chunkCount || 0
    };
  } catch (error) {
    return {
      success: false,
      pdfLoaded: false,
      error: error.message
    };
  }
}

/**
 * Tool schema for LLM function calling
 */
export const ragToolSchema = {
  name: 'ragTool',
  description: 'Chat with an uploaded PDF document. Use this when user wants to ask questions about a PDF, extract information from documents, or discuss content in a file.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The question or message about the PDF content'
      },
      sessionId: {
        type: 'string',
        description: 'Optional session ID for maintaining conversation context'
      },
      userId: {
        type: 'string',
        description: 'Optional user ID'
      }
    },
    required: ['message']
  }
};
