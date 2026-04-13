/**
 * Quiz Tool - Interfaces with existing quiz generation endpoint
 * Calls: POST /generate
 */

import axios from 'axios';

import { getBackendPublicUrl } from '../../config/app.config.js';

const backendBaseUrl = getBackendPublicUrl();

/**
 * Generates a quiz based on user request
 * @param {Object} params - Quiz generation parameters
 * @param {string} params.topic - The topic for the quiz
 * @param {string} params.difficulty - Difficulty level (easy, medium, hard)
 * @param {number} params.questionCount - Number of questions to generate
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.docText - Document text for context (optional)
 * @returns {Promise<Object>} Quiz data
 */
export async function quizTool({ topic, difficulty = 'medium', questionCount = 10, userId, docText }) {
  try {
    const response = await axios.post(`${backendBaseUrl}/quiz/generate`, {
      topic,
      difficulty,
      questionCount,
      userId,
      docText: docText || null
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tool: 'quiz',
      data: response.data,
      message: `Generated a ${difficulty} quiz on "${topic}" with ${questionCount} questions`
    };
  } catch (error) {
    console.error('❌ Quiz tool error:', error.message);
    return {
      success: false,
      tool: 'quiz',
      error: error.response?.data?.error || error.message,
      message: 'Failed to generate quiz'
    };
  }
}

/**
 * Tool schema for LLM function calling
 */
export const quizToolSchema = {
  name: 'quizTool',
  description: 'Generate a quiz on any topic. Use this when user wants to take a quiz, test their knowledge, or practice questions on a subject.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic or subject for the quiz (e.g., "JavaScript", "World History", "Machine Learning")'
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Difficulty level of the quiz',
        default: 'medium'
      },
      questionCount: {
        type: 'number',
        description: 'Number of questions to generate (default 10)',
        default: 10
      },
      userId: {
        type: 'string',
        description: 'Optional user ID for tracking'
      }
    },
    required: ['topic']
  }
};
