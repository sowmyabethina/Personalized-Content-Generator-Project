import { coerceDisplayString } from "../../../utils/learning/coerceDisplayString";

/**
 * Important Concept Component
 * Highlights a key concept in a purple/violet box after summary
 */
const ImportantConceptSection = ({ concept }) => {
  const text = coerceDisplayString(concept);
  if (!text.trim()) return null;
  
  return (
    <div style={styles.importantConceptContainer} className="section-fade-in">
      <div style={styles.importantConceptHeader}>
        <span style={styles.importantTitle}>Important Concept</span>
      </div>
      <p style={styles.importantText}>{text}</p>
    </div>
  );
};

const styles = {
  importantConceptContainer: {
    background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    borderLeft: '5px solid #9333ea',
    borderRadius: '12px',
    padding: '20px 20px 20px 24px',
    marginBottom: '28px',
    boxShadow: '0 2px 8px rgba(147, 51, 234, 0.1)',
  },
  
  importantConceptHeader: {
    marginBottom: '8px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
  },
  
  importantTitle: {
    color: '#9333ea',
    fontSize: '13px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  
  importantText: {
    color: '#581c87',
    fontSize: '16px',
    lineHeight: '1.75',
    margin: 0,
    fontWeight: '500',
  },
};

export default ImportantConceptSection;
