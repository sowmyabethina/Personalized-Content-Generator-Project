/**
 * Quiz Scoring & Level Classification Constants
 * Centralized score thresholds and skill level definitions
 */

// ============================================
// SCORE CLASSIFICATION THRESHOLDS
// ============================================

// Base classification (from quiz score alone)
export const SCORE_THRESHOLDS_BASE = {
  BEGINNER_MAX: 40,      // < 40 = Beginner
  INTERMEDIATE_MAX: 70,  // 40-70 = Intermediate, >70 = Advanced
};

// Boosted classification (with profile boost)
export const SCORE_THRESHOLDS_BOOSTED = {
  BEGINNER_MAX: 45,      // < 45 = Beginner
  INTERMEDIATE_MAX: 75,  // 45-75 = Intermediate, >75 = Advanced
};

// Technical level from percentage
export const TECHNICAL_LEVEL_THRESHOLDS = {
  ADVANCED_MIN: 80,      // >= 80 = Advanced
  INTERMEDIATE_MIN: 60,  // 60-79 = Intermediate, <60 = Beginner
};

// Psychometric profile percentage thresholds
export const PSYCHOMETRIC_THRESHOLDS = {
  ADVANCED_MIN: 70,      // >= 70% = Advanced
  INTERMEDIATE_MIN: 35,  // 35-69% = Intermediate, <35% = Beginner
};

// ============================================
// SKILL BOOST CONFIGURATION
// ============================================
export const SKILL_BOOST = {
  GITHUB_MATCH: 10,      // Points for GitHub profile skill match
  RESUME_MATCH: 10,      // Points for resume skill match
  MAX_BOOST: 20,         // Maximum total points possible
  SCORE_CAP: 100,        // Maximum final score
};

// ============================================
// LEVEL CLASSIFICATIONS
// ============================================
export const SKILL_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

/**
 * Classify base level from percentage
 * @param {number} percent - Score percentage (0-100)
 * @returns {string} - BEGINNER, INTERMEDIATE, or ADVANCED
 */
export function classifyBaseLevel(percent) {
  if (typeof percent !== 'number' || Number.isNaN(percent)) {
    throw new TypeError('Invalid percentage for classifyBaseLevel');
  }

  if (percent < SCORE_THRESHOLDS_BASE.BEGINNER_MAX) {
    return SKILL_LEVELS.BEGINNER;
  }
  if (percent <= SCORE_THRESHOLDS_BASE.INTERMEDIATE_MAX) {
    return SKILL_LEVELS.INTERMEDIATE;
  }
  return SKILL_LEVELS.ADVANCED;
}

/**
 * Classify boosted level from score
 * @param {number} boostedScore - Score after boost (0-100)
 * @returns {string} - BEGINNER, INTERMEDIATE, or ADVANCED
 */
export function classifyBoostedLevel(boostedScore) {
  if (typeof boostedScore !== 'number' || Number.isNaN(boostedScore)) {
    throw new TypeError('Invalid score for classifyBoostedLevel');
  }

  if (boostedScore < SCORE_THRESHOLDS_BOOSTED.BEGINNER_MAX) {
    return SKILL_LEVELS.BEGINNER;
  }
  if (boostedScore <= SCORE_THRESHOLDS_BOOSTED.INTERMEDIATE_MAX) {
    return SKILL_LEVELS.INTERMEDIATE;
  }
  return SKILL_LEVELS.ADVANCED;
}

/**
 * Get technical level from score
 * @param {number} score - Score value
 * @returns {string} - BEGINNER, INTERMEDIATE, or ADVANCED
 */
export function getTechnicalLevel(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    throw new TypeError('Invalid score for getTechnicalLevel');
  }

  if (score >= TECHNICAL_LEVEL_THRESHOLDS.ADVANCED_MIN) {
    return SKILL_LEVELS.ADVANCED;
  }
  if (score >= TECHNICAL_LEVEL_THRESHOLDS.INTERMEDIATE_MIN) {
    return SKILL_LEVELS.INTERMEDIATE;
  }
  return SKILL_LEVELS.BEGINNER;
}

/**
 * Classify psychometric level from percentage
 * @param {number} percentage - Percentage value (0-100)
 * @returns {string} - BEGINNER, INTERMEDIATE, or ADVANCED
 */
export function classifyPsychometricLevel(percentage) {
  if (typeof percentage !== 'number' || Number.isNaN(percentage)) {
    throw new TypeError('Invalid percentage for classifyPsychometricLevel');
  }

  if (percentage >= PSYCHOMETRIC_THRESHOLDS.ADVANCED_MIN) {
    return SKILL_LEVELS.ADVANCED;
  }
  if (percentage >= PSYCHOMETRIC_THRESHOLDS.INTERMEDIATE_MIN) {
    return SKILL_LEVELS.INTERMEDIATE;
  }
  return SKILL_LEVELS.BEGINNER;
}

export default {
  SCORE_THRESHOLDS_BASE,
  SCORE_THRESHOLDS_BOOSTED,
  TECHNICAL_LEVEL_THRESHOLDS,
  PSYCHOMETRIC_THRESHOLDS,
  SKILL_BOOST,
  SKILL_LEVELS,
  classifyBaseLevel,
  classifyBoostedLevel,
  getTechnicalLevel,
  classifyPsychometricLevel,
};
