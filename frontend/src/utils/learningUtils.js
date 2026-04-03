/**
 * Learning Utility Functions
 * Helper functions extracted from LearningMaterialPage
 */

// ============================================
// DATA VALIDATION HELPERS
// ============================================

/**
 * Check if text content is valid
 * @param {string} content - Text to validate
 * @returns {boolean} - True if valid
 */
export const isValidText = (content) => {
  if (content === null || content === undefined) return false;
  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === '[object Object]') return false;
  if (trimmed.length <= 5) return false;
  return true;
};

/**
 * Check if array is valid
 * @param {Array} arr - Array to validate
 * @returns {boolean} - True if valid
 */
export const isValidArray = (arr) => {
  if (arr === null || arr === undefined) return false;
  if (!Array.isArray(arr)) return false;
  return arr.length >= 1;
};

/**
 * Check if summary is meaningful (at least 2 sentences)
 * @param {string} content - Content to check
 * @returns {boolean} - True if meaningful
 */
export const isMeaningfulSummary = (content) => {
  if (!isValidText(content)) return false;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length >= 2;
};

/**
 * Check if section title indicates tips/concepts type content
 * @param {string} title - Section title
 * @returns {boolean} - True if should skip summary
 */
export const shouldSkipSummary = (title) => {
  if (!title) return false;
  const skipKeywords = ['tips', 'concepts', 'highlights', 'notes', 'summary', 'key points', 'important', 'revision'];
  const lowerTitle = title.toLowerCase();
  return skipKeywords.some(keyword => lowerTitle.includes(keyword));
};

/**
 * Check if section heading should be hidden
 * @param {string} lessonTitle - Lesson title
 * @param {string} heading - Section heading
 * @returns {boolean} - True if should hide
 */
export const shouldHideSectionHeading = (lessonTitle, heading) => {
  if (!lessonTitle || !heading) return false;
  return lessonTitle.toLowerCase().trim() === heading.toLowerCase().trim();
};

/**
 * Check if lesson is Learning Tips lesson
 * @param {string} title - Lesson title
 * @returns {boolean} - True if tips lesson
 */
export const isLearningTipsLesson = (title) => {
  if (!title) return false;
  return title.toLowerCase().includes('tips') || title.toLowerCase().includes('tip');
};

/**
 * Format learning tips text into bullet points
 * @param {Array} tips - Tips array
 * @returns {Array} - Formatted tips
 */
export const formatLearningTips = (tips) => {
  if (!tips || !Array.isArray(tips)) return [];
  
  return tips.map(tip => {
    if (!tip || typeof tip !== 'string') return null;
    
    const parts = tip
      .split('**')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    return parts.length > 0 ? parts.join(' ') : tip;
  }).filter(tip => tip && tip.length > 0);
};

/**
 * Check if Examples section should be shown
 * @param {string} lessonTitle - Lesson title
 * @param {Array} examples - Examples array
 * @returns {boolean} - True if should show
 */
export const shouldShowExamples = (lessonTitle, examples) => {
  if (!examples || !Array.isArray(examples) || examples.length === 0) return false;
  
  const title = lessonTitle?.toLowerCase() || '';
  
  const skipKeywords = ['tips', 'notes', 'highlights', 'revision'];
  if (skipKeywords.some(keyword => title.includes(keyword))) {
    return false;
  }
  
  if (title.includes('project')) {
    const hasRealCode = examples.some(
      ex => ex && ex.code &&
            typeof ex.code === 'string' &&
            ex.code.trim().length > 10 &&
            !ex.code.toLowerCase().includes('example') &&
            !ex.code.toLowerCase().includes('basic')
    );
    if (!hasRealCode) return false;
  }
  
  const isValidExample = (ex) => {
    if (!ex || !ex.code || typeof ex.code !== 'string') return false;
    const code = ex.code.trim();
    if (code.length < 10) return false;
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes('example code here') ||
        lowerCode.includes('basic example') ||
        lowerCode.includes('sample code here')) {
      return false;
    }
    return true;
  };
  
  const validExamples = examples.filter(isValidExample);
  return validExamples.length > 0;
};

/**
 * Get dynamic heading for section type
 * @param {string} sectionType - Section type
 * @param {string} title - Section title
 * @returns {string} - Dynamic heading
 */
export const getDynamicHeading = (sectionType, title) => {
  const headingMap = {
    summary: 'Overview',
    importantConcept: 'Important Concept',
    thinkQuestion: 'Think About It',
    keyPoints: 'Key Concepts',
    examples: 'Examples',
    applications: 'Applications'
  };
  
  if (title && shouldSkipSummary(title)) {
    if (title.toLowerCase().includes('tips')) return 'Learning Tips';
    if (title.toLowerCase().includes('concept')) return 'Key Concepts';
    if (title.toLowerCase().includes('note')) return 'Important Notes';
    if (title.toLowerCase().includes('highlight')) return 'Highlights';
    if (title.toLowerCase().includes('revision')) return 'Quick Revision';
    if (sectionType === 'summary') return null;
  }
  
  return headingMap[sectionType] || 'Section';
};

/**
 * Validate checkpoint has valid question and options
 * @param {Object} checkpoint - Checkpoint object
 * @returns {boolean} - True if valid
 */
export const isValidCheckpoint = (checkpoint) => {
  if (!checkpoint) return false;
  if (!isValidText(checkpoint.question)) return false;
  if (!isValidArray(checkpoint.options) || checkpoint.options.length < 2) return false;
  if (typeof checkpoint.correctAnswer !== 'number') return false;
  if (checkpoint.correctAnswer < 0 || checkpoint.correctAnswer >= checkpoint.options.length) {
    return false;
  }
  return true;
};

/**
 * Check if content should be displayed in bullet points
 * @param {string} content - Content string
 * @returns {boolean} - True if should display as bullets
 */
export const shouldDisplayAsBullets = (content) => {
  if (!isValidText(content)) return false;
  
  const contentLower = content.toLowerCase();
  const bulletIndicators = [
    'key takeaways',
    'what you will learn',
    'in this lesson',
    'you will understand',
    'learn to',
    'by the end of',
    'master',
    'acquire skills',
    'objectives'
  ];
  
  const score = bulletIndicators.filter(ind => contentLower.includes(ind)).length;
  
  return score >= 1 || content.split('\n').length >= 3;
};

/**
 * Check if section should be skipped in display
 * @param {Object} section - Section object
 * @returns {boolean} - True if should skip
 */
export const shouldSkipSection = (section) => {
  if (!section) return true;
  if (section.summary && shouldSkipSummary(section.title)) return true;
  if (section.title?.toLowerCase().includes('quick revision')) return true;
  return false;
};

/**
 * Check if text has URL
 * @param {string} text - Text to check
 * @returns {boolean} - True if has URL
 */
export const hasUrl = (text) => {
  if (!isValidText(text)) return false;
  const urlPattern = /https?:\/\/[^\s]+/g;
  return urlPattern.test(text);
};

/**
 * Check if section has code examples
 * @param {Object} section - Section object
 * @returns {boolean} - True if has code
 */
export const hasCodeExamples = (section) => {
  if (!section || !section.examples) return false;
  return section.examples.some(ex => ex && ex.code && isValidText(ex.code));
};