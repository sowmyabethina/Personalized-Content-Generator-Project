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
 * Check if application is valid
 */
const isValidApplication = (app) => {
  if (!app) return false;
  if (typeof app === 'string') return app.trim().length > 10;
  if (typeof app === 'object') {
    return app.title || app.description;
  }
  return false;
};

/**
 * Real-World Applications Component
 * Displays applications in card/grid format with dynamic heading
 * Handles both string and object formats safely
 */
const ApplicationsSection = ({ applications }) => {
  if (!applications || !Array.isArray(applications) || applications.length === 0) return null;
  
  const validApps = applications.filter(isValidApplication);
  if (validApps.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Applications</h3>
      </div>
      <div style={styles.applicationsGrid}>
        {validApps.map((app, idx) => {
          const isString = typeof app === 'string';
          const appTitle = isString ? `Application ${idx + 1}` : (app.title || `Application ${idx + 1}`);
          const appDescription = isString ? app : (app.description || '');
          
          return (
            <div key={idx} style={styles.applicationCard}>
              <h4 style={styles.applicationTitle}>{appTitle}</h4>
              <p style={styles.applicationDescription}>{safeRender(appDescription)}</p>
            </div>
          );
        })}
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
