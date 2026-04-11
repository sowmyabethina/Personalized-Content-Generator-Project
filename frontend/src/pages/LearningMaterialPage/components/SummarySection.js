import { shouldHideSectionHeading } from "../../../utils/learning/presentationHelpers";

/**
 * Summary Section Component
 * Displays the main overview of the lesson with dynamic heading
 */
const SummarySection = ({ content, title, lessonTitle }) => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) return null;
   
  const heading = title || 'Overview';
  const hideHeading = shouldHideSectionHeading(lessonTitle, heading);
  
  return (
    <div style={styles.sectionContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        {!hideHeading && <h3 style={styles.sectionTitle}>{heading}</h3>}
      </div>
      <p style={styles.summaryText}>{content}</p>
    </div>
  );
};

const styles = {
  sectionContainer: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
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
  
  summaryText: {
    color: '#475569',
    fontSize: '17px',
    lineHeight: '1.85',
    margin: 0,
  },
};

export default SummarySection;
