/**
 * Content Generation Tool - Interfaces with content generation endpoints
 * Handles: Learning material, personalized content, combined content generation
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Generate learning content based on topic and preferences
 * @param {Object} params - Generation parameters
 * @param {string} params.topic - Topic for content generation
 * @param {string} params.technicalLevel - Technical level (beginner, intermediate, advanced)
 * @param {string} params.learningStyle - Learning style (visual, auditory, reading, kinesthetic)
 * @param {string} params.userId - User ID
 * @returns {Promise<Object>} Generated content
 */
export async function contentTool({ topic, technicalLevel = 'intermediate', learningStyle = 'reading', userId }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/learning/generate-learning-material`, {
      topic: topic || 'General Technology',
      technicalLevel,
      learningStyle,
      userId
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tool: 'content',
      data: response.data,
      message: `Generated learning material on "${topic}"`
    };
  } catch (error) {
    console.error('❌ Content tool error:', error.message);
    return {
      success: false,
      tool: 'content',
      error: error.response?.data?.error || error.message,
      message: 'Failed to generate content'
    };
  }
}

/**
 * Generate personalized content combining user profile
 * @param {Object} params - Parameters
 * @param {string} params.topic - Topic
 * @param {string} params.technicalLevel - User's technical level
 * @param {string} params.learningStyle - User's learning style
 * @param {number} params.technicalScore - User's technical score
 * @param {number} params.learningScore - User's learning score
 * @returns {Promise<Object>} Generated content
 */
export async function personalizedContentTool({ topic, technicalLevel, learningStyle, technicalScore, learningScore, userId }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/learning/generate-combined-content`, {
      topic: topic || 'General Technology',
      technicalLevel: technicalLevel || 'intermediate',
      learningStyle: learningStyle || 'reading',
      technicalScore: technicalScore || 50,
      learningScore: learningScore || 50,
      combinedAnalysis: ''
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tool: 'content',
      data: response.data,
      message: `Generated personalized content on "${topic}"`
    };
  } catch (error) {
    console.error('❌ Personalized content tool error:', error.message);
    return {
      success: false,
      tool: 'content',
      error: error.response?.data?.error || error.message,
      message: 'Failed to generate personalized content'
    };
  }
}

/**
 * Generate quiz from extracted text (document-based)
 * @param {Object} params - Parameters
 * @param {string} params.docText - Extracted text from document
 * @param {string} params.topic - Topic (optional)
 * @returns {Promise<Object>} Generated quiz
 */
export async function quizFromTextTool({ docText, topic }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/quiz/generate`, {
      docText: docText.substring(0, 12000)
    }, {
      timeout: 90000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tool: 'quiz',
      data: response.data,
      message: `Generated quiz from document`
    };
  } catch (error) {
    console.error('❌ Quiz from text tool error:', error.message);
    return {
      success: false,
      tool: 'quiz',
      error: error.response?.data?.error || error.message,
      message: 'Failed to generate quiz from text'
    };
  }
}

/**
 * Tool schema for LLM function calling - Content Generation
 */
export const contentToolSchema = {
  name: 'contentTool',
  description: 'Generate educational learning material, tutorials, or explanations on any topic. Use this when user wants to learn about a topic, get explanations, or need study materials.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic or subject to generate content about (e.g., "JavaScript", "Machine Learning", "World History")'
      },
      technicalLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'Difficulty level of the content',
        default: 'intermediate'
      },
      learningStyle: {
        type: 'string',
        enum: ['visual', 'auditory', 'reading', 'kinesthetic'],
        description: 'Preferred learning style',
        default: 'reading'
      },
      userId: {
        type: 'string',
        description: 'Optional user ID for tracking'
      }
    },
    required: ['topic']
  }
};

/**
 * Tool schema for LLM function calling - Personalized Content
 */
export const personalizedContentToolSchema = {
  name: 'personalizedContentTool',
  description: 'Generate highly personalized learning content based on user\'s technical level, learning style, and scores. Use when you know the user\'s profile or want customized content.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic to generate personalized content for'
      },
      technicalLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'User\'s technical expertise level'
      },
      learningStyle: {
        type: 'string',
        enum: ['visual', 'auditory', 'reading', 'kinesthetic'],
        description: 'User\'s preferred learning style'
      },
      technicalScore: {
        type: 'number',
        description: 'User\'s technical score (0-100)'
      },
      learningScore: {
        type: 'number',
        description: 'User\'s learning score (0-100)'
      },
      userId: {
        type: 'string',
        description: 'User ID for tracking'
      }
    },
    required: ['topic']
  }
};

/**
 * Tool schema for LLM function calling - Quiz from Text
 */
export const quizFromTextToolSchema = {
  name: 'quizFromTextTool',
  description: 'Generate quiz questions from extracted document text or PDF content. Use when user has uploaded a document and wants to be tested on its content.',
  parameters: {
    type: 'object',
    properties: {
      docText: {
        type: 'string',
        description: 'The extracted text content from a document or PDF to generate questions from'
      },
      topic: {
        type: 'string',
        description: 'Optional topic or subject label for the quiz'
      }
    },
    required: ['docText']
  }
};
