import { useState } from "react";
import { coerceDisplayString } from "../../../utils/learning/coerceDisplayString";

/**
 * Copy Button Component
 * Small button to copy code to clipboard
 */
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    const safe = coerceDisplayString(code);
    navigator.clipboard.writeText(safe);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      style={styles.copyButton}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const styles = {
  copyButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default CopyButton;
