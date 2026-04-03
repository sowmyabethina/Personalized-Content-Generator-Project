/**
 * Check if text content is valid
 * Returns true if string length > 5, rejects null, undefined, empty, "[object Object]"
 */
export const isValidText = (content) => {
  if (content === null || content === undefined) return false;
  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === '[object Object]') return false;
  if (trimmed.length <= 5) return false; // Require more than 5 characters
  return true;
};

/**
 * Check if array is valid (not null, undefined, and has at least 1 item)
 */
export const isValidArray = (arr) => {
  if (arr === null || arr === undefined) return false;
  if (!Array.isArray(arr)) return false;
  return arr.length >= 1;
};

/**
 * Check if summary is meaningful (at least 2 sentences)
 */
export const isMeaningfulSummary = (content) => {
  if (!isValidText(content)) return false;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length >= 2;
};

/**
 * Check if section title indicates tips/concepts type content
 */
export const shouldSkipSummary = (title) => {
  if (!title) return false;
  const skipKeywords = ['tips', 'concepts', 'highlights', 'notes', 'summary', 'key points', 'important', 'revision'];
  const lowerTitle = title.toLowerCase();
  return skipKeywords.some(keyword => lowerTitle.includes(keyword));
};

/**
 * Check if section heading should be hidden (when same as lesson title)
 */
export const shouldHideSectionHeading = (lessonTitle, heading) => {
  if (!lessonTitle || !heading) return false;
  return lessonTitle.toLowerCase().trim() === heading.toLowerCase().trim();
};

/**
 * Check if the lesson is a Learning Tips lesson
 */
export const isLearningTipsLesson = (title) => {
  if (!title) return false;
  return title.toLowerCase().includes('tips') || title.toLowerCase().includes('tip');
};

/**
 * Format learning tips text into bullet points
 * Converts "**bold text** more text" into structured list items
 */
export const formatLearningTips = (tips) => {
  if (!tips || !Array.isArray(tips)) return [];
  
  return tips.map(tip => {
    if (!tip || typeof tip !== 'string') return null;
    
    // Split by ** markers and filter empty strings
    const parts = tip
      .split('**')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    // If we have parts, join them as a single formatted tip
    // Otherwise return the original tip
    return parts.length > 0 ? parts.join(' ') : tip;
  }).filter(tip => tip && tip.length > 0);
};

/**
 * Check if Examples section should be shown
 * Only show for technical lessons, not for tips/notes/highlights/revision
 */
export const shouldShowExamples = (lessonTitle, examples) => {
  if (!examples || !Array.isArray(examples) || examples.length === 0) return false;
  
  const title = lessonTitle?.toLowerCase() || '';
  
  // Skip for non-technical sections
  const skipKeywords = ['tips', 'notes', 'highlights', 'revision'];
  if (skipKeywords.some(keyword => title.includes(keyword))) {
    return false;
  }
  
  // Skip for final project if no real code exists
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
  
  // Filter out invalid/empty examples
  const isValidExample = (ex) => {
    if (!ex || !ex.code || typeof ex.code !== 'string') return false;
    const code = ex.code.trim();
    // Skip if too short or contains placeholder text
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
 * Get icon for each section type
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
  
  // For sections with custom titles - override summary heading
  if (title && shouldSkipSummary(title)) {
    if (title.toLowerCase().includes('tips')) return 'Learning Tips';
    if (title.toLowerCase().includes('concept')) return 'Key Concepts';
    if (title.toLowerCase().includes('note')) return 'Important Notes';
    if (title.toLowerCase().includes('highlight')) return 'Highlights';
    if (title.toLowerCase().includes('revision')) return 'Quick Revision';
    // Don't show "Overview" for tips/concepts type sections
    if (sectionType === 'summary') return null;
  }
  
  return headingMap[sectionType] || 'Section';
};

/**
 * Validate checkpoint has valid question and options
 */
export const isValidCheckpoint = (checkpoint) => {
  if (!checkpoint) return false;
  if (!isValidText(checkpoint.question)) return false;
  if (!isValidArray(checkpoint.options) || checkpoint.options.length < 2) return false;
  return true;
};

/**
 * Generate fallback checkpoint if none exists
 */
export const generateFallbackCheckpoint = (lesson) => {
  const title = lesson?.title || 'this lesson';
  return {
    question: `What is the key concept of ${title}?`,
    options: [
      'Understanding the main idea',
      'Memorizing all details',
      'Skipping the content',
      'None of the above'
    ],
    correctAnswer: 0
  };
};

/**
 * Enhance content if it's weak
 */
export const enhanceContent = (lesson) => {
  const { sections, title } = lesson;
  const enhanced = { ...lesson, sections: { ...sections } };
  
  // Safety check - ensure sections exists
  if (!sections) return enhanced;
  
  // Ensure summary is meaningful (2-3 sentences)
  if (!isMeaningfulSummary(sections?.summary)) {
    if (sections?.summary && typeof sections.summary === 'string') {
      const sentences = sections.summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length < 2) {
        // Expand short summary to 2-3 sentences
        enhanced.sections.summary = sections.summary +
          ' This concept forms the foundation for understanding ' +
          (title || 'this topic') + ' and is essential for practical application.';
      }
    }
  }
  
  // Ensure keyPoints has at least 3 items
  if (!sections?.keyPoints || sections.keyPoints.length < 3) {
    enhanced.sections.keyPoints = Array.isArray(sections?.keyPoints) ? [...sections.keyPoints] : [];
    if (enhanced.sections.keyPoints.length < 3) {
      enhanced.sections.keyPoints.push('Important foundational concept to understand');
      enhanced.sections.keyPoints.push('Essential for practical application');
      if (enhanced.sections.keyPoints.length < 3) {
        enhanced.sections.keyPoints.push('Key skill for professional development');
      }
    }
  }
  
  // Ensure examples has at least 1 example
  if (!sections?.examples || sections.examples.length < 1) {
    enhanced.sections.examples = Array.isArray(sections?.examples) ? [...sections.examples] : [];
    if (enhanced.sections.examples.length < 1) {
      // Add a basic example
      enhanced.sections.examples.push({
        title: 'Basic Example',
        description: `A simple example demonstrating ${title || 'this concept'}`,
        code: '// Example code here',
        output: 'Expected output'
      });
    }
  }
  
  return enhanced;
};

/**
 * Convert legacy learning material to structured lessons format
 */
export const convertSectionsToLessons = (learningMaterial) => {
  const lessons = [];
  
  // Add overview as first lesson if available
  if (learningMaterial?.summary) {
    lessons.push({
      title: "Overview",
      estimatedTime: "5 min",
      sections: {
        summary: learningMaterial.summary,
        keyPoints: learningMaterial.learningTips || [],
        realWorldApplications: [],
        examples: [],
        practiceQuestions: []
      }
    });
  }
  
  // Convert sections to structured lessons
  if (learningMaterial?.sections && Array.isArray(learningMaterial.sections)) {
    learningMaterial.sections.forEach((section) => {
      const examples = [];
      
      // Convert examples
      if (section.examples && Array.isArray(section.examples)) {
        section.examples.forEach((ex) => {
          examples.push({
            title: ex.title || "Example",
            description: ex.description || "",
            code: ex.code || ""
          });
        });
      }
      
      lessons.push({
        title: section.title || `Section ${lessons.length + 1}`,
        estimatedTime: "10 min",
        sections: {
          summary: section.content || "",
          keyPoints: section.keyPoints || [],
          realWorldApplications: [],
          examples: examples,
          practiceQuestions: []
        }
      });
    });
  }
  
  // Add learning tips if available
  if (learningMaterial?.learningTips && learningMaterial.learningTips.length > 0) {
    lessons.push({
      title: "Learning Tips",
      estimatedTime: "3 min",
      sections: {
        summary: "Helpful tips to enhance your learning experience:",
        keyPoints: learningMaterial.learningTips,
        realWorldApplications: [],
        examples: [],
        practiceQuestions: []
      }
    });
  }
  
  // Add final project if available
  if (learningMaterial?.finalProject) {
    const questions = learningMaterial.finalProject.steps || [];
    lessons.push({
      title: "Final Project",
      estimatedTime: "20 min",
      sections: {
        summary: learningMaterial.finalProject.description || "Complete this project to practice what you've learned.",
        keyPoints: [],
        realWorldApplications: [
          { title: learningMaterial.finalProject.title || "Project", description: learningMaterial.finalProject.description || "" }
        ],
        examples: [],
        practiceQuestions: questions
      }
    });
  }
  
  // If no lessons were created, use sample lessons
  return lessons.length > 0 ? lessons : [];
};
