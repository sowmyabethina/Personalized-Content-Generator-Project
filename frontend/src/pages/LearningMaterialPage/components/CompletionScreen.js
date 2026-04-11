/**
 * Completion Screen Component
 * Shows what user learned before final quiz
 */
const CompletionScreen = ({ lessons, onTakeQuiz, onGoBack }) => {
  const completedLessons = lessons.length;
  
  // Gather all key points from lessons
  const allKeyPoints = lessons.flatMap(l => l.sections?.keyPoints || []).slice(0, 5);
  
  // Calculate total time
  const totalTime = lessons.reduce((acc, l) => {
    const time = parseInt(l.estimatedTime?.replace(/\D/g, '') || '0');
    return acc + time;
  }, 0);
  
  // Motivational messages
  const messages = [
    "Great job! You've built a solid foundation.",
    "Well done! You're making excellent progress.",
    "Impressive! Your dedication is paying off.",
    "Excellent work! Keep up the momentum."
  ];
  const motivationalMessage = messages[completedLessons % messages.length];
  
  return (
    <div style={styles.completionContainer}>
      <div style={styles.completionIcon}>🎉</div>
      <h2 style={styles.completionTitle}>Lesson Complete!</h2>
      <p style={styles.completionSubtitle}>{motivationalMessage}</p>
      
      {/* Progress Summary */}
      <div style={styles.progressSummary}>
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{completedLessons}</span>
          <span style={styles.progressLabel}>Lessons</span>
        </div>
        <div style={styles.progressDivider} />
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{totalTime}</span>
          <span style={styles.progressLabel}>Minutes</span>
        </div>
        <div style={styles.progressDivider} />
        <div style={styles.progressStat}>
          <span style={styles.progressNumber}>{allKeyPoints.length}</span>
          <span style={styles.progressLabel}>Concepts</span>
        </div>
      </div>
      
      <div style={styles.completionHighlights}>
        {allKeyPoints.map((point, idx) => (
          <div key={idx} style={styles.completionHighlightItem}>
            <span style={styles.completionCheck}>✓</span>
            <span>{point}</span>
          </div>
        ))}
      </div>
      
      <div style={styles.completionButtons}>
        <button 
          onClick={onTakeQuiz}
          style={styles.quizButton}
        >
          Take Final Quiz 🚀
        </button>
        <button 
          onClick={onGoBack}
          style={styles.reviewButton}
        >
          Review Lessons
        </button>
      </div>
    </div>
  );
};

const styles = {
  completionContainer: {
    textAlign: 'center',
    padding: '48px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  
  completionIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  
  completionTitle: {
    color: '#1e293b',
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 8px 0',
  },
  
  completionSubtitle: {
    color: '#64748b',
    fontSize: '16px',
    margin: '0 0 24px 0',
  },
  
  progressSummary: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '20px 32px',
    marginBottom: '32px',
  },
  
  progressStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  progressNumber: {
    color: '#4f46e5',
    fontSize: '28px',
    fontWeight: '800',
  },
  
  progressLabel: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  
  progressDivider: {
    width: '1px',
    height: '40px',
    background: '#e2e8f0',
  },
  
  completionHighlights: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  
  completionHighlightItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '15px',
  },
  
  completionCheck: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: '16px',
  },
  
  completionButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  
  quizButton: {
    padding: '16px 40px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
  },
  
  reviewButton: {
    padding: '16px 40px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default CompletionScreen;
