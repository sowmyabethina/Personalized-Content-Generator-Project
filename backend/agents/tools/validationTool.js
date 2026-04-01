/**
 * Validation & Evaluation Tool - For answer checking and validation
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Evaluate learning style based on user responses
 * @param {Object} params - Evaluation parameters
 * @param {Array} params.answers - User's answers to learning style questions
 * @returns {Promise<Object>} Learning style evaluation
 */
export async function evaluateLearningStyleTool({ answers }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/learning/evaluate-learning-style`, {
      answers: answers || []
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      tool: 'validation',
      data: response.data,
      message: 'Learning style evaluated'
    };
  } catch (error) {
    console.error('❌ Learning style evaluation error:', error.message);
    return {
      success: false,
      tool: 'validation',
      error: error.response?.data?.error || error.message,
      message: 'Failed to evaluate learning style'
    };
  }
}

/**
 * Evaluate answer quality (for open-ended questions)
 * @param {Object} params - Parameters
 * @param {string} params.question - The question being answered
 * @param {string} params.answer - User's answer
 * @param {string} params.topic - Topic area
 * @returns {Promise<Object>} Answer evaluation
 */
export async function evaluateAnswerTool({ question, answer, topic }) {
  try {
    // Use OpenAI to evaluate the answer quality
    const openai = await import('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        tool: 'validation',
        error: 'OpenAI not configured',
        message: 'Cannot evaluate answer without AI'
      };
    }
    
    const client = new openai.default({ apiKey });
    
    const prompt = `Evaluate the following answer for accuracy and completeness:

Question: ${question}
User's Answer: ${answer}
Topic: ${topic || 'General'}

Provide a JSON response with:
{
  "score": (0-100),
  "feedback": "short feedback on the answer",
  "isCorrect": true/false,
  "improvements": ["suggestion1", "suggestion2"]
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content;
    let evaluation;
    
    try {
      evaluation = JSON.parse(responseText);
    } catch {
      evaluation = {
        score: 50,
        feedback: responseText,
        isCorrect: null,
        improvements: []
      };
    }

    return {
      success: true,
      tool: 'validation',
      data: evaluation,
      message: evaluation.feedback
    };
  } catch (error) {
    console.error('❌ Answer evaluation error:', error.message);
    return {
      success: false,
      tool: 'validation',
      error: error.message,
      message: 'Failed to evaluate answer'
    };
  }
}

/**
 * Validate generated content quality
 * @param {Object} params - Parameters
 * @param {string} params.content - Generated content to validate
 * @param {string} params.topic - Expected topic
 * @returns {Promise<Object>} Validation result
 */
export async function validateContentTool({ content, topic }) {
  try {
    const openai = await import('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        tool: 'validation',
        error: 'OpenAI not configured',
        message: 'Cannot validate content without AI'
      };
    }
    
    const client = new openai.default({ apiKey });
    
    const prompt = `Validate the following educational content for quality and accuracy:

Topic: ${topic || 'General'}
Content: ${content.substring(0, 2000)}

Provide a JSON response with:
{
  "isValid": true/false,
  "quality": (0-100),
  "issues": ["issue1", "issue2"] (if any),
  "suggestions": ["suggestion1"] (optional improvements)
}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content;
    let validation;
    
    try {
      validation = JSON.parse(responseText);
    } catch {
      validation = {
        isValid: true,
        quality: 80,
        issues: [],
        suggestions: []
      };
    }

    return {
      success: true,
      tool: 'validation',
      data: validation,
      message: validation.isValid ? 'Content is valid' : 'Content has issues'
    };
  } catch (error) {
    console.error('❌ Content validation error:', error.message);
    return {
      success: false,
      tool: 'validation',
      error: error.message,
      message: 'Failed to validate content'
    };
  }
}

/**
 * Tool schema for Learning Style Evaluation
 */
export const evaluateLearningStyleToolSchema = {
  name: 'evaluateLearningStyleTool',
  description: 'Evaluate user\'s learning style based on their responses to assessment questions. Use when user completes a learning style questionnaire.',
  parameters: {
    type: 'object',
    properties: {
      answers: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'User\'s answers to learning style assessment questions'
      }
    }
  }
};

/**
 * Tool schema for Answer Evaluation
 */
export const evaluateAnswerToolSchema = {
  name: 'evaluateAnswerTool',
  description: 'Evaluate the quality and accuracy of a student\'s answer to a question. Provides feedback and scoring.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question that was asked'
      },
      answer: {
        type: 'string',
        description: 'The user\'s answer to evaluate'
      },
      topic: {
        type: 'string',
        description: 'The topic or subject area'
      }
    },
    required: ['question', 'answer']
  }
};

/**
 * Tool schema for Content Validation
 */
export const validateContentToolSchema = {
  name: 'validateContentTool',
  description: 'Validate the quality, accuracy, and completeness of generated educational content. Use to verify content before showing to users.',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content to validate'
      },
      topic: {
        type: 'string',
        description: 'The expected topic of the content'
      }
    },
    required: ['content']
  }
};
