import { useState } from "react";

function Help() {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getArrowRotation = (isOpen) => ({
    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
  });

  const gettingStartedSteps = [
    {
      number: "1",
      text: "Sign in to the platform using your Google or LinkedIn account",
    },
    {
      number: "2",
      text: "Choose your input method: upload a Resume PDF or enter a GitHub profile link",
    },
    {
      number: "3",
      text: "Click 'Analyze' to process your document or profile",
    },
    {
      number: "4",
      text: "View your personalized learning path and start your journey",
    },
  ];

  const featuresFAQ = [
    {
      question: "How do I use PDF Chat?",
      answer: "Navigate to the PDF Chat section from the navigation menu. Upload a PDF document and start asking questions. The AI will analyze your document and provide relevant answers based on its content.",
    },
    {
      question: "How do I track my progress?",
      answer: "Visit the Progress page from the navigation menu to see your learning analytics, completed courses, quiz scores, and overall progress. The dashboard provides visual representations of your achievements.",
    },
  ];

  const commonIssues = [
    {
      icon: "📁",
      issue: "File not uploading",
      solution: "Ensure your file is in PDF format and less than 10MB. Check your internet connection and try refreshing the page. Make sure you're using a supported browser like Chrome, Firefox, or Edge.",
    },
    {
      icon: "🔗",
      issue: "Invalid GitHub link",
      solution: "Make sure you're providing a valid GitHub profile URL in the format: github.com/yourusername. Check that your profile is public and accessible.",
    },
    {
      icon: "⏳",
      issue: "Analysis taking too long",
      solution: "Large documents may take longer to process. Please wait a few minutes for the analysis to complete. If the issue persists, try with a smaller file or contact support.",
    },
  ];

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Find answers to common questions and get started</p>
        </div>

        {/* Getting Started */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🚀</span> Getting Started
            </h2>
          </div>
          <div className="card">
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              {gettingStartedSteps.map((step, index) => (
                <li key={index} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    marginRight: '10px'
                  }}>{step.number}</span>
                  {step.text}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Using Features */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>💡</span> Using Features
            </h2>
          </div>
          <div className="card">
            {featuresFAQ.map((faq, index) => (
              <div key={index} style={{ borderBottom: index < featuresFAQ.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: index < featuresFAQ.length - 1 ? '16px' : '0', marginBottom: index < featuresFAQ.length - 1 ? '16px' : '0' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }} 
                  onClick={() => toggleSection(`feature-${index}`)}
                >
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{faq.question}</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: getArrowRotation(openSections[`feature-${index}`])}}>▼</span>
                </div>
                {openSections[`feature-${index}`] && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: '12px' }}>{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Common Issues */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> Common Issues
            </h2>
          </div>
          <div className="card">
            {commonIssues.map((issue, index) => (
              <div key={index} style={{ borderBottom: index < commonIssues.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: index < commonIssues.length - 1 ? '16px' : '0', marginBottom: index < commonIssues.length - 1 ? '16px' : '0' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }}
                  onClick={() => toggleSection(`issue-${index}`)}
                >
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>{issue.icon}</span>
                    {issue.issue}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: getArrowRotation(openSections[`issue-${index}`])}}>▼</span>
                </div>
                {openSections[`issue-${index}`] && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', paddingTop: '12px', borderTop: '1px solid var(--border-color)', marginTop: '12px' }}>{issue.solution}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact / Support */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📧</span> Contact / Support
            </h2>
          </div>
          <div className="card" style={{ background: 'var(--color-info-light)', border: '1px solid var(--color-info)', textAlign: 'center' }}>
            <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-info)', marginBottom: '8px' }}>Need more help?</h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              If you can't find the answer you're looking for, feel free to reach out to our support team.
            </p>
            <button 
              style={{ 
                background: 'var(--color-primary)', 
                color: 'white', 
                padding: '10px 20px', 
                borderRadius: 'var(--radius-md)', 
                fontSize: 'var(--text-sm)', 
                fontWeight: 'var(--font-medium)', 
                textDecoration: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }} 
              onClick={() => window.location.href = "mailto:support@learningplatform.com"}
            >
              Contact Support
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Help;
