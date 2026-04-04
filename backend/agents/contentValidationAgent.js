/**
 * Content validation logic for generated learning material.
 * This module uses simple rule-based heuristics that can be later replaced by LLM-based validation.
 */

/**
 * Convert object or string content into a normalized string for analysis.
 * @param {any} content
 * @returns {string}
 */
function stringifyContent(content) {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

/**
 * Check for topic relevance using keyword presence.
 * @param {string} topic
 * @param {string} text
 * @returns {{score:number, feedback:string[]}}
 */
function evaluateRelevance(topic, text) {
  const feedback = [];
  const normalizedText = text.toLowerCase();
  const topicWords = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (!topicWords.length) {
    return { score: 0, feedback: ['Topic tokens not found for relevance check'] };
  }

  let found = 0;
  topicWords.forEach((word) => {
    if (normalizedText.includes(word)) {
      found += 1;
    }
  });

  const relevanceScore = Math.round((found / topicWords.length) * 100);

  if (relevanceScore < 50) {
    feedback.push('Content is weakly related to topic keywords.');
  } else if (relevanceScore < 80) {
    feedback.push('Content is moderately related to the topic.');
  } else {
    feedback.push('Content is strongly related to topic.');
  }

  return { score: relevanceScore, feedback };
}

/**
 * Evaluate skill level alignment.
 * @param {string} skillLevel
 * @param {string} text
 * @returns {{score:number, feedback:string[]}}
 */
function evaluateSkillLevelAlignment(skillLevel, text) {
  const normalized = text.toLowerCase();
  const feedback = [];

  const patterns = {
    Beginner: ['basics', 'basic', 'introduction', 'getting started', 'simple', 'easy'],
    Intermediate: ['example', 'case study', 'moderate', 'practice', 'implementation', 'approach'],
    Advanced: ['advanced', 'deep', 'optimization', 'edge case', 'performance', 'scalability', 'architecture']
  };

  const selected = patterns[skillLevel] || [];

  if (!selected.length) {
    return { score: 50, feedback: ['Unknown skill level, default moderate alignment'] };
  }

  let matches = 0;
  selected.forEach((token) => {
    if (normalized.includes(token)) {
      matches += 1;
    }
  });

  const score = Math.min(100, Math.round((matches / selected.length) * 100));

  if (score < 40) {
    feedback.push(`Content does not align well with ${skillLevel} level markers.`);
  } else if (score < 70) {
    feedback.push(`Content has some ${skillLevel} indicators but can improve depth.`);
  } else {
    feedback.push(`Content aligns well with ${skillLevel} skill expectations.`);
  }

  return { score, feedback };
}

/**
 * Validate if topic exists in user skill sources.
 * @param {string} topic
 * @param {string[]} githubSkills
 * @param {string[]} resumeSkills
 * @returns {{match:boolean, message:string}}
 */
function topicInSkills(topic, githubSkills, resumeSkills) {
  const normalizedTopic = topic.toLowerCase().trim();
  const hasGithub = Array.isArray(githubSkills) && githubSkills.some((s) => String(s).toLowerCase().trim() === normalizedTopic);
  const hasResume = Array.isArray(resumeSkills) && resumeSkills.some((s) => String(s).toLowerCase().trim() === normalizedTopic);
  if (hasGithub || hasResume) {
    return { match: true, message: 'Topic is present in user profile skills.' };
  }
  return { match: false, message: 'Topic not found in GitHub or resume skills; confidence is reduced.' };
}

/**
 * Evaluate performance alignment based on quiz score and expected content complexity.
 * @param {number} quizScore
 * @param {string} skillLevel
 * @param {string} text
 * @returns {{score:number, feedback:string[]}}
 */
function evaluatePerformanceAlignment(quizScore, skillLevel, text) {
  const normalized = text.toLowerCase();
  const feedback = [];

  let desired = 'Beginner';
  if (quizScore > 70) desired = 'Advanced';
  else if (quizScore >= 40) desired = 'Intermediate';

  const levelHints = {
    Beginner: ['basics', 'introduction', 'simple', 'overview'],
    Intermediate: ['example', 'practice', 'use case', 'implementation'],
    Advanced: ['deep', 'optimization', 'edge case', 'architecture']
  };

  const tokens = levelHints[desired] || [];
  let matchCount = 0;
  tokens.forEach((token) => {
    if (normalized.includes(token)) {
      matchCount += 1;
    }
  });

  const score = Math.min(100, Math.round((matchCount / Math.max(1, tokens.length)) * 100));

  if (desired !== skillLevel) {
    feedback.push(`Quiz performance suggests ${desired} material, but requested skill level is ${skillLevel}.`);
  } else {
    feedback.push(`Quiz performance and skill level are consistent (${desired}).`);
  }

  if (score < 40) {
    feedback.push('Content depth does not match performance expectations.');
  } else {
    feedback.push('Content depth is reasonably aligned with performance expectations.');
  }

  return { score, feedback };
}

/**
 * Main content validation interface
 * @param {Object} params
 * @param {string} params.topic
 * @param {string|object} params.generatedContent
 * @param {string} params.skillLevel - Beginner|Intermediate|Advanced
 * @param {number} params.quizScore
 * @param {number} params.totalQuestions
 * @param {string[]} params.githubSkills
 * @param {string[]} params.resumeSkills
 * @returns {Promise<Object>}
 */
export async function validateContent({
  topic,
  generatedContent,
  skillLevel,
  quizScore,
  totalQuestions,
  githubSkills = [],
  resumeSkills = []
}) {
  try {
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      throw new TypeError('topic is required and must be a non-empty string');
    }

    if (generatedContent === undefined || generatedContent === null) {
      throw new TypeError('generatedContent is required');
    }

    if (typeof skillLevel !== 'string' || !skillLevel.trim()) {
      throw new TypeError('skillLevel is required and must be a string');
    }

    if (typeof quizScore !== 'number' || typeof totalQuestions !== 'number' || totalQuestions <= 0) {
      throw new TypeError('quizScore and totalQuestions must be valid numbers');
    }

    const contentText = stringifyContent(generatedContent);

    const { score: relevanceScore, feedback: relevanceFeedback } = evaluateRelevance(topic, contentText);
    const { score: skillAlignmentScore, feedback: skillFeedback } = evaluateSkillLevelAlignment(skillLevel, contentText);
    const { score: performanceAlignmentScore, feedback: performanceFeedback } = evaluatePerformanceAlignment(quizScore, skillLevel, contentText);

    const skillMatch = topicInSkills(topic, githubSkills, resumeSkills);
    const skillMatchPenalty = skillMatch.match ? 0 : 15;

    const rawOverview = relevanceScore * 0.4 + skillAlignmentScore * 0.3 + performanceAlignmentScore * 0.3;
    const overallScore = Math.max(0, Math.min(100, Math.round(rawOverview - skillMatchPenalty)));

    const suggestions = [];
    if (relevanceScore < 60) suggestions.push('Add more direct topic keywords and definitions relevant to the topic.');
    if (skillAlignmentScore < 50) suggestions.push(`Add content cues for ${skillLevel} level, such as ${skillLevel === 'Beginner' ? 'fundamental concepts and simple examples' : skillLevel === 'Intermediate' ? 'practical examples and moderate depth' : 'deep dives, edge cases, and optimization strategies'}.`);
    if (performanceAlignmentScore < 50) suggestions.push('Align content depth more closely with quiz performance (simplify for low scores, or deepen for high scores).');
    if (!skillMatch.match) suggestions.push('Ensure you reference how this topic maps to user experience or skills in GitHub/resume.');

    const feedback = [
      ...relevanceFeedback,
      ...skillFeedback,
      ...performanceFeedback,
      skillMatch.message
    ].join(' ');

    return {
      isValid: overallScore >= 65,
      overallScore,
      feedback,
      suggestions,
      details: {
        relevanceScore,
        skillAlignmentScore,
        performanceAlignmentScore,
        skillMatch: skillMatch.match
      }
    };
  } catch (error) {
    throw new Error(`Content validation failed: ${error.message}`);
  }
}
