// Helper utilities for quiz scoring and level classification

/**
 * Safely calculate percentage (0-100)
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number}
 */
export function calculatePercentage(correct, total) {
  if (typeof correct !== 'number' || typeof total !== 'number' || total <= 0) {
    throw new TypeError('Invalid numeric inputs for calculatePercentage');
  }

  const raw = (correct / total) * 100;
  return Math.min(100, Math.max(0, Number(raw.toFixed(2))));
}

/**
 * Compute base level from percentage
 * @param {number} percent
 * @returns {string} Beginner | Intermediate | Advanced
 */
export function classifyBaseLevel(percent) {
  if (typeof percent !== 'number' || Number.isNaN(percent)) {
    throw new TypeError('Invalid percentage for classifyBaseLevel');
  }

  if (percent < 40) return 'Beginner';
  if (percent <= 70) return 'Intermediate';
  return 'Advanced';
}

/**
 * Compute enhanced level from boosted score
 * @param {number} boostedScore
 * @returns {string} Beginner | Intermediate | Advanced
 */
export function classifyBoostedLevel(boostedScore) {
  if (typeof boostedScore !== 'number' || Number.isNaN(boostedScore)) {
    throw new TypeError('Invalid score for classifyBoostedLevel');
  }

  if (boostedScore < 45) return 'Beginner';
  if (boostedScore <= 75) return 'Intermediate';
  return 'Advanced';
}
