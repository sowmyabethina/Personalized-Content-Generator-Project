/**
 * AI Configuration
 * Google Gemini AI client setup
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI client
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Get a configured Gemini model instance
 * @param {string} modelName - Model name to use (default: gemini-2.5-flash)
 * @returns {Object} - Configured model or null if not initialized
 */
function getModel(modelName = 'gemini-2.5-flash') {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

module.exports = {
  genAI,
  getModel
};