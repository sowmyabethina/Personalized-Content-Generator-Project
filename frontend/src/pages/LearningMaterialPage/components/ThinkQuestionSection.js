/**
 * Think Question Component
 * Displays a reflective question for deeper engagement
 */
const ThinkQuestionSection = ({ question }) => {
  if (!question || typeof question !== 'string' || question.trim().length === 0) return null;
  
  return (
    <div style={styles.thinkQuestionContainer} className="section-fade-in">
      <div style={styles.thinkQuestionHeader}>
        <span style={styles.thinkTitle}>Think About It</span>
      </div>
      <p style={styles.thinkQuestionText}>{question}</p>
    </div>
  );
};

const styles = {
  thinkQuestionContainer: {
    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    borderLeft: '5px solid #f97316',
    borderRadius: '12px',
    padding: '20px 20px 20px 24px',
    marginBottom: '36px',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.1)',
  },
  
  thinkQuestionHeader: {
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
  },
  
  thinkTitle: {
    color: '#ea580c',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  
  thinkQuestionText: {
    color: '#9a3412',
    fontSize: '16px',
    lineHeight: '1.75',
    margin: 0,
    fontWeight: '500',
  },
};

export default ThinkQuestionSection;
