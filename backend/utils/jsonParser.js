/**
 * JSON Parser Utility
 * Centralized JSON parsing for AI responses
 */

/**
 * Parse JSON from AI response text
 * Handles common formatting issues like code blocks
 * @param {string} rawText - Raw text from AI response
 * @returns {Object} - Parsed JSON object
 * @throws {Error} - If parsing fails
 */
function parseJson(rawText) {
  if (!rawText) {
    throw new Error('Empty AI output');
  }

  // Clean up response
  let jsonStr = rawText.trim();
  
  // Remove code block markers
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  // If model added preamble/postamble, isolate outermost JSON object
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonStr.trim());
}

/**
 * Safely parse JSON with fallback
 * @param {string} rawText - Raw text from AI response
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {Object} - Parsed JSON object or fallback
 */
function safeParseJson(rawText, fallback = null) {
  try {
    return parseJson(rawText);
  } catch (err) {
    console.warn('JSON parse warning:', err.message);
    return fallback;
  }
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} - True if valid JSON
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export { parseJson, safeParseJson, isValidJson };
export default { parseJson, safeParseJson, isValidJson };
