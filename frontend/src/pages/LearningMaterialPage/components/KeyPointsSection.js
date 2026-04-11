import {
  formatLearningTips,
  isLearningTipsLesson,
  shouldHideSectionHeading,
} from "../../../utils/learning/presentationHelpers";

/**
 * Safely render any value as string
 */
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).filter(Boolean).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Key Points Component
 * Displays important points in a highlighted box with dynamic heading
 * Handles both string and object formats safely
 */
const KeyPointsSection = ({ points, title, lessonTitle }) => {
  if (!points || !Array.isArray(points) || points.length === 0) return null;
  
  const heading = title || 'Key Concepts';
  const hideHeading = shouldHideSectionHeading(lessonTitle, heading);
  const isTips = isLearningTipsLesson(lessonTitle);
  
  const validPoints = points.filter(p => {
    const rendered = safeRender(p);
    return rendered.trim().length > 0;
  });
  
  if (validPoints.length === 0) return null;
  
  const formattedPoints = isTips ? formatLearningTips(validPoints) : validPoints;
  
  return (
    <div style={styles.keyPointsContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        {!hideHeading && <h3 style={styles.sectionTitle}>{heading}</h3>}
      </div>
      <ul style={styles.keyPointsList}>
        {formattedPoints.map((point, idx) => (
          <li key={idx} style={styles.keyPointItem}>{safeRender(point)}</li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  keyPointsContainer: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '36px',
  },
  
  sectionHeader: {
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
  },
  
  sectionTitle: {
    margin: 0,
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: '600',
  },
  
  keyPointsList: {
    margin: 0,
    paddingLeft: '24px',
  },
  
  keyPointItem: {
    marginBottom: '12px',
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#1e40af',
  },
};

export default KeyPointsSection;
