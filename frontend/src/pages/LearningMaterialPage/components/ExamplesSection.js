import CopyButton from "./CopyButton";

/**
 * Examples Component
 * Displays code examples with syntax highlighting style
 */
const ExamplesSection = ({ examples }) => {
  if (!examples || !Array.isArray(examples) || examples.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Examples</h3>
      </div>
      {examples.map((example, idx) => (
        <div key={idx} style={styles.exampleCard}>
          <div style={styles.exampleHeader}>
            <span style={styles.exampleTitle}>{example.title}</span>
            {example.code && <CopyButton code={example.code} />}
          </div>
          {example.description && (
            <p style={styles.exampleDescription}>{example.description}</p>
          )}
          {example.code && (
            <pre style={styles.codeBlock}>
              <code>{example.code}</code>
            </pre>
          )}
          {example.output && (
            <div style={styles.outputContainer}>
              <span style={styles.outputLabel}>Output:</span>
              <code style={styles.outputText}>{example.output}</code>
            </div>
          )}
        </div>
      ))}
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
  
  exampleCard: {
    background: '#1e293b',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  
  exampleHeader: {
    background: '#334155',
    padding: '12px 18px',
    borderBottom: '1px solid #475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  exampleTitle: {
    margin: 0,
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
  },
  
  exampleDescription: {
    padding: '16px 18px',
    margin: 0,
    color: '#94a3b8',
    fontSize: '14px',
    fontStyle: 'italic',
    borderBottom: '1px solid #334155',
    background: '#0f172a',
  },
  
  codeBlock: {
    margin: 0,
    padding: '20px',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '14px',
    lineHeight: '1.8',
    overflow: 'auto',
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
  },
  
  outputContainer: {
    background: '#064e3b',
    padding: '12px 16px',
    borderTop: '1px solid #065f46',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  
  outputLabel: {
    color: '#6ee7b7',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  
  outputText: {
    color: '#a7f3d0',
    fontSize: '13px',
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
};

export default ExamplesSection;
