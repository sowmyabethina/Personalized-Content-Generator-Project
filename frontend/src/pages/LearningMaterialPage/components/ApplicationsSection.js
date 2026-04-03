/**
 * Real-World Applications Component
 * Displays applications in card/grid format with dynamic heading
 */
const ApplicationsSection = ({ applications }) => {
  if (!applications || !Array.isArray(applications) || applications.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Applications</h3>
      </div>
      <div style={styles.applicationsGrid}>
        {applications.map((app, idx) => (
          <div key={idx} style={styles.applicationCard}>
            <h4 style={styles.applicationTitle}>{app.title}</h4>
            <p style={styles.applicationDescription}>{app.description}</p>
          </div>
        ))}
      </div>
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
  
  applicationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  
  applicationCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px',
    transition: 'all 0.2s ease',
  },
  
  applicationTitle: {
    margin: '0 0 10px 0',
    color: '#059669',
    fontSize: '15px',
    fontWeight: '700',
  },
  
  applicationDescription: {
    margin: 0,
    color: '#475569',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};

export default ApplicationsSection;
