import {
  calculatePercentage,
  classifyBaseLevel,
  classifyBoostedLevel
} from '../utils/scoringUtils.js';

/**
 * Evaluate skill level using quiz score and profile skills
 * @param {Object} params
 * @param {number} params.quizScore - points scored (0-100)
 * @param {number} params.totalQuestions
 * @param {string} params.topic
 * @param {string[]} [params.githubSkills=[]]
 * @param {string[]} [params.resumeSkills=[]]
 * @returns {Promise<Object>}
 */
export async function evaluateSkillLevel({
  quizScore,
  totalQuestions,
  topic,
  githubSkills = [],
  resumeSkills = []
}) {
  try {
    if (typeof quizScore !== 'number' || typeof totalQuestions !== 'number') {
      throw new TypeError('quizScore and totalQuestions must be numbers');
    }

    if (!topic || typeof topic !== 'string') {
      throw new TypeError('topic must be a non-empty string');
    }

    if (!Array.isArray(githubSkills) || !Array.isArray(resumeSkills)) {
      throw new TypeError('githubSkills and resumeSkills must be arrays');
    }

    const normalizedTopic = topic.trim().toLowerCase();
    const basePercentage = Number(quizScore);

    // base classification must use raw quiz percentage
    const baseLevel = classifyBaseLevel(basePercentage);

    // boost points from profile match
    let boost = 0;

    if (githubSkills.some(skill => String(skill).toLowerCase() === normalizedTopic)) {
      boost += 10;
    }
    if (resumeSkills.some(skill => String(skill).toLowerCase() === normalizedTopic)) {
      boost += 10;
    }

    const finalScore = Math.min(100, Math.max(0, basePercentage + boost));
    const finalLevel = classifyBoostedLevel(finalScore);

    return {
      level: finalLevel,
      baseLevel,
      percentage: basePercentage,
      boost,
      finalScore
    };
  } catch (error) {
    throw new Error(`Skill evaluation failed: ${error.message}`);
  }
}
