import SummarySection from "./SummarySection";
import ImportantConceptSection from "./ImportantConceptSection";
import KeyPointsSection from "./KeyPointsSection";
import ApplicationsSection from "./ApplicationsSection";
import ExamplesSection from "./ExamplesSection";
import ThinkQuestionSection from "./ThinkQuestionSection";

/**
 * Check if text content is valid
 */
const isValidText = (content) => {
  if (content === null || content === undefined) return false;
  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === '[object Object]') return false;
  if (trimmed.length <= 5) return false;
  return true;
};

/**
 * Check if array is valid (not null, undefined, and has at least 1 item)
 */
const isValidArray = (arr) => {
  if (arr === null || arr === undefined) return false;
  if (!Array.isArray(arr)) return false;
  return arr.length >= 1;
};

/**
 * Check if summary is meaningful (at least 2 sentences)
 */
const isMeaningfulSummary = (content) => {
  if (!isValidText(content)) return false;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length >= 2;
};

/**
 * Check if section title indicates tips/concepts type content
 */
const shouldSkipSummary = (title) => {
  if (!title) return false;
  const skipKeywords = ['tips', 'concepts', 'highlights', 'notes', 'summary', 'key points', 'important', 'revision'];
  const lowerTitle = title.toLowerCase();
  return skipKeywords.some(keyword => lowerTitle.includes(keyword));
};

/**
 * Check if section heading should be hidden (when same as lesson title)
 */
const shouldHideSectionHeading = (lessonTitle, heading) => {
  if (!lessonTitle || !heading) return false;
  return lessonTitle.toLowerCase().trim() === heading.toLowerCase().trim();
};

/**
 * Check if the lesson is a Learning Tips lesson
 */
const isLearningTipsLesson = (title) => {
  if (!title) return false;
  return title.toLowerCase().includes('tips') || title.toLowerCase().includes('tip');
};

/**
 * Format learning tips text into bullet points
 */
const formatLearningTips = (tips) => {
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
 */
const shouldShowExamples = (lessonTitle, examples) => {
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
 * Get icon for each section type
 */
const getDynamicHeading = (sectionType, title) => {
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
 * Enhance content if it's weak
 */
const enhanceContent = (lesson) => {
  const { sections, title } = lesson;
  const enhanced = { ...lesson, sections: { ...sections } };
  
  if (!sections) return enhanced;
  
  if (!isMeaningfulSummary(sections?.summary)) {
    if (sections?.summary && typeof sections.summary === 'string') {
      const sentences = sections.summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length < 2) {
        enhanced.sections.summary = sections.summary +
          ' This concept forms the foundation for understanding ' +
          (title || 'this topic') + ' and is essential for practical application.';
      }
    }
  }
  
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
  
  if (!sections?.examples || sections.examples.length < 1) {
    enhanced.sections.examples = Array.isArray(sections?.examples) ? [...sections.examples] : [];
    if (enhanced.sections.examples.length < 1) {
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
 * Main Lesson Content Component
 * Renders all sections of a structured lesson with conditional rendering
 */
const LessonContent = ({ lesson }) => {
  console.log("Lesson:", lesson?.title);
  console.log("Sections:", lesson?.sections);
   
  const enhancedLesson = enhanceContent(lesson);
  const { sections, title: lessonTitle } = enhancedLesson;
   
  const shouldHideSummary = shouldSkipSummary(lessonTitle);
   
  const showSummary = isValidText(sections?.summary) &&
    (!shouldHideSummary || isMeaningfulSummary(sections.summary));
   
  return (
    <div style={styles.lessonContent}>
      {/* Important Concept - First */}
      {isValidText(sections?.importantConcept) && (
        <ImportantConceptSection
          concept={sections.importantConcept}
        />
      )}
      
      {/* Summary Section - Only show if valid and not redundant */}
      {showSummary && (
        <SummarySection
          content={sections.summary}
          title={shouldHideSummary ? getDynamicHeading('summary', lessonTitle) : getDynamicHeading('summary')}
          lessonTitle={lessonTitle}
        />
      )}
      
      {/* Think Question */}
      {isValidText(sections?.thinkQuestion) && (
        <ThinkQuestionSection
          question={sections.thinkQuestion}
        />
      )}
      
      {/* Key Points Section */}
      {isValidArray(sections?.keyPoints) && (
        <KeyPointsSection
          points={sections.keyPoints}
          title={getDynamicHeading('keyPoints', lessonTitle)}
          lessonTitle={lessonTitle}
        />
      )}
      
      {/* Real-World Applications Section */}
      {isValidArray(sections?.realWorldApplications) && (
        <ApplicationsSection
          applications={sections.realWorldApplications}
        />
      )}
      
      {/* Examples Section - Only show for technical lessons */}
      {shouldShowExamples(lessonTitle, sections?.examples) && (
        <ExamplesSection
          examples={sections.examples}
        />
      )}
    </div>
  );
};

const styles = {
  lessonContent: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default LessonContent;
