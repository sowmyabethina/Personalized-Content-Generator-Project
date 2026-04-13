/**
 * Error Messages & Response Strings
 * Centralized for consistency, easy updates, and localization
 */

// ============================================
// VALIDATION ERROR MESSAGES
// ============================================
export const VALIDATION_ERRORS = {
  MESSAGE_REQUIRED: 'Message is required',
  MESSAGE_LENGTH_EXCEEDED: (maxLength) => 
    `Message must be less than ${maxLength} characters`,
  
  TOPIC_REQUIRED: 'Topic is required',
  QUIZ_ID_REQUIRED: 'Quiz ID is required',
  ANSWERS_REQUIRED: 'Answers array is required',
  
  PDF_FILE_REQUIRED: 'No PDF file uploaded',
  GITHUB_URL_REQUIRED: 'GitHub URL is required',
  USER_ID_REQUIRED: 'User ID is required',
  
  DOCTEXT_OR_TOPIC_REQUIRED: 'docText or topic required',
  USER_PROFILE_REQUIRED: 'Missing user profile',
};

// ============================================
// NOT FOUND ERROR MESSAGES
// ============================================
export const NOT_FOUND_ERRORS = {
  QUIZ: 'Quiz not found',
  PDF: 'No PDF uploaded',
  USER: 'User not found',
  ANALYSIS: 'Analysis not found',
};

// ============================================
// CONFIGURATION ERROR MESSAGES
// ============================================
export const CONFIG_ERRORS = {
  GROQ_API_KEY_MISSING: 'GROQ_API_KEY is not configured',
  OPENAI_API_KEY_MISSING: 'OPENAI_API_KEY is not configured',
  DATABASE_CONFIG_MISSING: 'Database configuration missing: set DB_USER or DATABASE_URL env var',
  INVALID_RESPONSE_FORMAT: 'Invalid response format',
};

// ============================================
// PROCESSING ERROR MESSAGES
// ============================================
export const PROCESSING_ERRORS = {
  PDF_EXTRACTION_FAILED: 'PDF extraction failed',
  QUIZ_GENERATION_FAILED: 'Quiz generation failed',
  SCORING_FAILED: 'Scoring failed',
  CONTENT_GENERATION_FAILED: 'Content generation failed',
  GITHUB_EXTRACTION_FAILED: 'Unable to extract skills from repositories',
  GITHUB_NOT_FOUND: 'GitHub user not found',
  GITHUB_RATE_LIMIT: 'GitHub API rate limit exceeded',
  GITHUB_FETCH_FAILED: 'Unable to fetch GitHub data',
  INVALID_GEMINI_RESPONSE: 'Invalid Gemini response',
  EMPTY_GROQ_OUTPUT: 'Empty Groq output',
  EMPTY_FALLBACK_OUTPUT: 'Empty Groq fallback output',
};

// ============================================
// NETWORK ERROR MESSAGES
// ============================================
export const NETWORK_ERRORS = {
  PDF_FETCH_FAILED: 'Network error: Unable to connect to GitHub',
  FILE_NOT_FOUND: 'File not found on GitHub',
  ACCESS_FORBIDDEN: 'Access forbidden. GitHub may be rate-limiting or the file requires authentication',
  INVALID_FILE_TYPE: 'Invalid file type - not a PDF',
  GITHUB_URL_FORMAT: 'Invalid GitHub URL format. Please provide a direct link to a PDF file in a GitHub repository',
  GITHUB_REPO_ROOT: 'Cannot extract PDF from GitHub repository root. Please provide a direct link to a PDF file',
};

// ============================================
// GENERIC ERROR MESSAGES
// ============================================
export const GENERIC_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  SKILL_EVALUATION_FAILED: 'Skill evaluation failed',
  VALIDATION_FAILED: 'Validation failed',
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  QUIZ_GENERATED: 'Quiz generated successfully',
  QUIZ_SCORED: 'Quiz scored successfully',
  ANALYSIS_SAVED: 'Analysis saved successfully',
  GITHUB_ANALYZED: 'GitHub profile analyzed successfully!',
  PDF_EXTRACTED: 'PDF extracted successfully',
  RESUME_EXTRACTED: 'Resume PDF extracted successfully!',
  CONTENT_GENERATED: 'Content generated successfully',
  SKILL_EVALUATION_COMPLETE: 'Skill evaluation completed',
};

// ============================================
// ERROR RESPONSE HELPERS
// ============================================
/**
 * Create a validation error response
 */
export function createValidationError(field, message = null) {
  return {
    error: message || `${field} validation failed`,
    status: 400,
  };
}

/**
 * Create a not found error response
 */
export function createNotFoundError(resource) {
  return {
    error: NOT_FOUND_ERRORS[resource] || `${resource} not found`,
    status: 404,
  };
}

/**
 * Create a server error response
 */
export function createServerError(message = GENERIC_ERRORS.INTERNAL_SERVER_ERROR) {
  return {
    error: message,
    status: 500,
  };
}

export default {
  VALIDATION_ERRORS,
  NOT_FOUND_ERRORS,
  CONFIG_ERRORS,
  PROCESSING_ERRORS,
  NETWORK_ERRORS,
  GENERIC_ERRORS,
  SUCCESS_MESSAGES,
  createValidationError,
  createNotFoundError,
  createServerError,
};
