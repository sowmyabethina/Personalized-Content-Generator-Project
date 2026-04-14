/**
 * Frontend Error & Status Messages
 * User-friendly messages for the frontend
 */

import { EXTERNAL_URLS } from "./config.constants";

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  // Document handling
  PDF_EXTRACTION: 'PDF extraction failed. Please try again.',
  DOCUMENT_EXTRACTION: 'Document extraction failed. Please try again.',
  RESUME_EXTRACTION: 'Resume extraction failed. Please try again.',
  
  // GitHub integration
  GITHUB_NOT_FOUND: 'GitHub user not found. Please check the profile URL and try again.',
  GITHUB_RATE_LIMIT: 'GitHub API rate limit exceeded. Please try again later or configure a backend GitHub token.',
  GITHUB_FETCH_FAILED: 'Unable to fetch GitHub data. Please check the URL and try again.',
  GITHUB_ANALYSIS_FAILED: 'Failed to analyze GitHub profile. Please try again.',
  
  // Quiz operations
  QUIZ_GENERATION_FAILED: 'Failed to generate quiz. Please try again.',
  QUIZ_SCORING_FAILED: 'Failed to score quiz. Please try again.',
  
  // Learning content
  CONTENT_GENERATION_FAILED: 'Failed to generate content. Please try again.',
  LOADING_FAILED: 'Failed to load data. Please refresh and try again.',
  
  // Generic
  GENERAL: 'An error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  NOT_FOUND: 'Resource not found.',
};

// ============================================
// VALIDATION MESSAGES
// ============================================
export const VALIDATION_MESSAGES = {
  RESUME_REQUIRED: 'Please upload a Resume PDF file',
  TOPIC_REQUIRED: 'Please enter a topic',
  GITHUB_URL_REQUIRED: 'Please enter a GitHub profile URL',
  MESSAGE_REQUIRED: 'Please enter a message',
  FILE_REQUIRED: 'Please select a file',
};

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  GITHUB_ANALYZED: 'GitHub profile analyzed successfully!',
  PDF_EXTRACTED: 'Resume PDF extracted successfully!',
  QUIZ_GENERATED: 'Questions generated successfully!',
  QUIZ_SCORED: 'Quiz scored successfully!',
  CONTENT_GENERATED: 'Content generated successfully!',
  ANALYSIS_SAVED: 'Analysis saved successfully!',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  UPLOADED: 'Uploaded successfully!',
};

// ============================================
// INFO MESSAGES
// ============================================
export const INFO_MESSAGES = {
  ANALYZING: 'Analyzing profile...',
  EXTRACTING: 'Extracting content...',
  GENERATING: 'Generating content...',
  SCORING: 'Scoring quiz...',
  LOADING: 'Loading...',
  PROCESSING: 'Processing...',
};

// ============================================
// WARNING MESSAGES
// ============================================
export const WARNING_MESSAGES = {
  PROCEED_WITH_CAUTION: 'This action cannot be undone.',
  UNSAVED_CHANGES: 'You have unsaved changes.',
  LOW_SCORE: 'Your score is below average. Consider reviewing the material.',
};

// ============================================
// BUTTON LABELS
// ============================================
export const BUTTON_LABELS = {
  SUBMIT: 'Submit',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  GENERATE: 'Generate',
  ANALYZE: 'Analyze',
  UPLOAD: 'Upload',
  CANCEL: 'Cancel',
  RETRY: 'Try Again',
  DOWNLOAD: 'Download',
  COPY: 'Copy',
  CLEAR: 'Clear',
  RESET: 'Reset',
  CONFIRM: 'Confirm',
};

// ============================================
// PLACEHOLDER TEXTS
// ============================================
export const PLACEHOLDERS = {
  GITHUB_URL: EXTERNAL_URLS.GITHUB_PROFILE_EXAMPLE,
  TOPIC_INPUT: 'Enter a topic to learn',
  MESSAGE_INPUT: 'Type your question here...',
  SEARCH: 'Search...',
};

// ============================================
// LOADING STATES
// ============================================
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default {
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  WARNING_MESSAGES,
  BUTTON_LABELS,
  PLACEHOLDERS,
  LOADING_STATES,
};
