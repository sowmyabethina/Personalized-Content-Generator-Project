/**
 * Estimated Time Component
 * Displays the estimated time for the lesson
 */
const EstimatedTime = ({ time }) => {
  if (!time || typeof time !== 'string' || time.trim().length === 0) return null;
  
  return (
    <div style={styles.timeContainer} className="section-fade-in">
      <span style={styles.timeIcon}>⏱️</span>
      <span style={styles.timeText}>Estimated Time: {time}</span>
    </div>
  );
};

const styles = {
  timeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: '#f1f5f9',
    borderRadius: '20px',
    marginBottom: '16px',
    transition: 'all 0.2s ease',
  },
  
  timeIcon: {
    fontSize: '14px',
  },
  
  timeText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default EstimatedTime;
