/**
 * Frontend Configuration Constants
 * UI timeouts, animations, limits, and shared constants
 */

// ============================================
// ANIMATION & TRANSITION DURATIONS (milliseconds)
// ============================================
export const ANIMATIONS = {
  // Score reveal animation
  SCORE_REVEAL: parseInt(process.env.REACT_APP_ANIM_SCORE_REVEAL, 10) || 1400,
  
  // View fitting animation
  VIEW_FIT: parseInt(process.env.REACT_APP_ANIM_VIEW_FIT, 10) || 500,
  
  // CSS transitions
  TRANSITION_FAST: 150,
  TRANSITION_NORMAL: 200,
  TRANSITION_SLOW: 300,
};

// ============================================
// UI DELAYS (milliseconds)
// ============================================
export const DELAYS = {
  // Toast/notification display times
  TOAST_SUCCESS: parseInt(process.env.REACT_APP_TOAST_SUCCESS, 10) || 3000,
  TOAST_COPY: parseInt(process.env.REACT_APP_TOAST_COPY, 10) || 2000,
  TOAST_ERROR: parseInt(process.env.REACT_APP_TOAST_ERROR, 10) || 4000,
  
  // View fitting delay
  VIEW_FIT_INITIAL: parseInt(process.env.REACT_APP_DELAY_VIEW_FIT, 10) || 100,
};

// ============================================
// SCORE VISUALIZATION
// ============================================
export const SCORE_VISUAL = {
  CIRCLE_RADIUS: 80,
  ANIMATION_DURATION: 1400, // Must sync with ANIMATIONS.SCORE_REVEAL
  
  // Score color gradients
  COLORS: {
    POOR: { start: '#FF7E5F', end: '#FEB47B' },      // 0-39
    GOOD: { start: '#48C6EF', end: '#6F86D6' },      // 40-70
    EXCELLENT: { start: '#11998E', end: '#38EF7D' }, // 71+
  },
};

// ============================================
// VALIDATION LIMITS
// ============================================
export const LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
};

// ============================================
// API TIMEOUTS (milliseconds)
// ============================================
export const API_TIMEOUTS = {
  STANDARD: parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 30000,
  UPLOAD: parseInt(process.env.REACT_APP_UPLOAD_TIMEOUT, 10) || 60000,
};

// ============================================
// PAGE CONFIGURATION
// ============================================
export const PAGES = {
  HOME: '/',
  QUIZ: '/quiz',
  LEARNING: '/learning',
  ANALYSIS: '/analysis',
  PDF_CHAT: '/pdf-chat',
  RESULTS: '/results',
};

// ============================================
// LOCAL STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  EXTRACTED_CONTENT: 'extractedContent',
  DOCUMENT_SOURCE_TYPE: 'documentSourceType',
  DOCUMENT_SOURCE_URL: 'documentSourceUrl',
  EXTRACTED_SKILLS: 'extractedSkills',
  CURRENT_ANALYSIS_ID: 'currentAnalysisId',
  QUIZ_DATA: 'quizData',
  QUIZ_ID: 'quizId',
  LEARNING_STYLE: 'learningStyle',
  TECHNICAL_LEVEL: 'technicalLevel',
};

// ============================================
// INPUT TYPES
// ============================================
export const INPUT_TYPES = {
  GITHUB: 'github',
  RESUME: 'resume',
  PDF: 'pdf',
  TOPIC: 'topic',
};

export default {
  ANIMATIONS,
  DELAYS,
  SCORE_VISUAL,
  LIMITS,
  API_TIMEOUTS,
  PAGES,
  STORAGE_KEYS,
  INPUT_TYPES,
};
