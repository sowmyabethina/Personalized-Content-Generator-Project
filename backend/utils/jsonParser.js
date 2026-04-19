/**
 * JSON Parser Utility
 * Centralized JSON parsing for AI responses (objects and arrays)
 */

import { logError } from './logger.js';

const RAW_PREVIEW_LEN = 800;

function stripMarkdownFences(text) {
  let s = String(text).trim();
  if (!s) return '';
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  return s.trim();
}

/**
 * Extract first balanced JSON object or array from a string (handles preamble/postamble).
 * @param {string} input
 * @returns {string|null}
 */
export function extractBalancedJson(input) {
  const s = String(input).trim();
  let start = -1;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '{' || ch === '[') {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  const stack = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < s.length; i += 1) {
    const c = s[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inString) {
      if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === '{' || c === '[') {
      stack.push(c === '{' ? '}' : ']');
      continue;
    }

    if (c === '}' || c === ']') {
      if (stack.length === 0) return null;
      const expect = stack.pop();
      if (c !== expect) return null;
      if (stack.length === 0) {
        return s.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Parse JSON from AI response text
 * Handles code fences, preamble text, and top-level arrays (legacy brace-slice broke arrays).
 * @param {string} rawText - Raw text from AI response
 * @returns {Object|Array} - Parsed JSON
 * @throws {Error} - If parsing fails
 */
function parseJson(rawText) {
  if (rawText == null || String(rawText).trim() === '') {
    throw new Error('Empty AI output');
  }

  const original = String(rawText);
  let jsonStr = stripMarkdownFences(original);

  const attempts = [];
  attempts.push(jsonStr);
  const balanced = extractBalancedJson(jsonStr);
  if (balanced && balanced !== jsonStr) {
    attempts.push(balanced);
  }

  let lastErr = null;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      lastErr = e;
    }
  }

  const preview = original.length > RAW_PREVIEW_LEN ? `${original.slice(0, RAW_PREVIEW_LEN)}…` : original;
  logError('parseJson: failed to parse AI JSON', lastErr || new Error('unknown'));
  console.error('[parseJson] Raw preview:', preview);
  throw new Error(`Invalid JSON from AI: ${lastErr?.message || 'parse error'}`);
}

/**
 * Safely parse JSON with fallback
 * @param {string} rawText - Raw text from AI response
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {Object|Array|null} - Parsed JSON or fallback
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
export default { parseJson, safeParseJson, isValidJson, extractBalancedJson };
