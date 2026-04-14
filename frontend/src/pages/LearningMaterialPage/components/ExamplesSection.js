import CopyButton from "./CopyButton";
import { coerceDisplayString, coerceExampleRecord } from "../../../utils/learning/coerceDisplayString";

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
 * Check if example is valid object with content
 */
const isValidExampleObject = (example) => {
  if (!example) return false;
  if (typeof example === 'string') return example.trim().length > 0;
  if (typeof example === 'object') {
    const rec = coerceExampleRecord(example);
    const codeStr = rec.code;
    const descStr = rec.description;
    const outStr = rec.output;
    const hasContent = codeStr.trim().length > 0 || descStr.trim().length > 0 || outStr.trim().length > 0;
    if (!hasContent) return false;
    if (codeStr && typeof codeStr === 'string') {
      const lowerCode = codeStr.toLowerCase();
      if (lowerCode.includes('example code here') && lowerCode.length < 80) return false;
    }
    return true;
  }
  return false;
};

/**
 * Examples Component
 * Displays code examples with syntax highlighting style
 * Handles both string and object formats safely
 */
const ExamplesSection = ({ examples }) => {
  if (!examples || !Array.isArray(examples) || examples.length === 0) return null;
  
  const validExamples = examples.filter(isValidExampleObject);
  if (validExamples.length === 0) return null;
  
  return (
    <div style={styles.sectionContainer} className="section-fade-in">
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Examples</h3>
      </div>
      {validExamples.map((example, idx) => {
        const isString = typeof example === 'string';
        const rec = isString
          ? {
              title: `Example ${idx + 1}`,
              code: coerceDisplayString(example),
              output: '',
              description: '',
            }
          : coerceExampleRecord(example);
        const exampleTitle = rec.title || `Example ${idx + 1}`;
        const exampleCode = rec.code;
        const exampleDescription = rec.description;
        const exampleOutput = rec.output;
        
        return (
          <div key={idx} style={styles.exampleCard}>
            <div style={styles.exampleHeader}>
              <span style={styles.exampleTitle}>{exampleTitle}</span>
              {exampleCode && <CopyButton code={exampleCode} />}
            </div>
            {exampleDescription && (
              <p style={styles.exampleDescription}>{exampleDescription}</p>
            )}
            {exampleCode && (
              <pre style={styles.codeBlock}>
                <code>{exampleCode}</code>
              </pre>
            )}
            {exampleOutput && (
              <div style={styles.outputContainer}>
                <span style={styles.outputLabel}>Output</span>
                <pre style={styles.outputText}>{exampleOutput}</pre>
              </div>
            )}
          </div>
        );
      })}
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
