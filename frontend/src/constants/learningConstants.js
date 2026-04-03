/**
 * Learning Constants
 * Static data and configurations for learning pages
 */

// ============================================
// LEARNING STYLES
// ============================================

export const LEARNING_STYLES = {
  READING: 'reading',
  VISUAL: 'visual',
  AUDITORY: 'auditory',
  KINESTHETIC: 'kinesthetic'
};

export const LEARNING_STYLE_LABELS = {
  [LEARNING_STYLES.READING]: '📖 Reading',
  [LEARNING_STYLES.VISUAL]: '🎨 Visual',
  [LEARNING_STYLES.AUDITORY]: '🎧 Auditory',
  [LEARNING_STYLES.KINESTHETIC]: '✋ Practice'
};

// ============================================
// TECHNICAL LEVELS
// ============================================

export const TECHNICAL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const LEVEL_LABELS = {
  [TECHNICAL_LEVELS.BEGINNER]: '🌱 Beginner',
  [TECHNICAL_LEVELS.INTERMEDIATE]: '🌿 Intermediate',
  [TECHNICAL_LEVELS.ADVANCED]: '🌳 Advanced'
};

// ============================================
// EXPERIENCE LEVELS
// ============================================

export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead'
};

export const EXPERIENCE_LABELS = {
  [EXPERIENCE_LEVELS.ENTRY]: 'Entry Level (0-2 yrs)',
  [EXPERIENCE_LEVELS.MID]: 'Mid Level (2-5 yrs)',
  [EXPERIENCE_LEVELS.SENIOR]: 'Senior (5-10 yrs)',
  [EXPERIENCE_LEVELS.LEAD]: 'Lead/Principal (10+ yrs)'
};

// ============================================
// SECTION TYPES
// ============================================

export const SECTION_TYPES = {
  SUMMARY: 'summary',
  KEY_POINTS: 'keyPoints',
  EXAMPLES: 'examples',
  APPLICATIONS: 'applications',
  PRACTICE_QUESTIONS: 'practiceQuestions',
  QUICK_REVISION: 'quickRevision'
};

// ============================================
// LESSON STRUCTURE TEMPLATE
// ============================================

export const LESSON_TEMPLATE = {
  title: '',
  estimatedTime: '20 min',
  importantConcept: '',
  thinkQuestion: '',
  sections: {
    summary: '',
    keyPoints: [],
    applications: [],
    examples: [],
    practiceQuestions: [],
    quickRevision: []
  },
  checkpoint: {
    question: '',
    options: [],
    correctAnswer: 0
  }
};

// ============================================
// STEP CONFIGURATION
// ============================================

export const LEARNING_STEPS = {
  TOPIC_SELECTION: 0,
  STYLE_SELECTION: 1,
  MATERIAL_DISPLAY: 2,
  COMPLETION: 3
};

// ============================================
// PDF CONFIGURATION
// ============================================

export const PDF_CONFIG = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 20,
  fontSize: {
    title: 18,
    heading: 14,
    body: 11
  }
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  TOPIC_REQUIRED: 'Please enter a topic to learn about',
  GENERATION_FAILED: 'Failed to generate learning material. Please try again.',
  SAVE_FAILED: 'Failed to save analysis. Please try again.',
  LOAD_FAILED: 'Failed to load analyses. Please refresh the page.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
};

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  MATERIAL_GENERATED: 'Learning material generated successfully!',
  ANALYSIS_SAVED: 'Analysis saved successfully!',
  PDF_DOWNLOADED: 'PDF downloaded successfully!'
};

export default {
  LEARNING_STYLES,
  LEARNING_STYLE_LABELS,
  TECHNICAL_LEVELS,
  LEVEL_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LABELS,
  SECTION_TYPES,
  LESSON_TEMPLATE,
  LEARNING_STEPS,
  PDF_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};