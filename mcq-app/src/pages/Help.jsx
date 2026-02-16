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

  const styles = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
    },
    title: {
      fontSize: "36px",
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: "12px",
    },
    subtitle: {
      fontSize: "18px",
      color: "#64748b",
    },
    section: {
      marginBottom: "32px",
    },
    sectionTitle: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    sectionIcon: {
      fontSize: "24px",
    },
    card: {
      background: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
      marginBottom: "12px",
    },
    accordionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      padding: "12px 0",
    },
    question: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1f2937",
    },
    answer: {
      fontSize: "14px",
      color: "#64748b",
      lineHeight: "1.7",
      paddingTop: "12px",
      borderTop: "1px solid #e5e7eb",
      marginTop: "12px",
    },
    arrow: {
      fontSize: "18px",
      color: "#64748b",
      transition: "transform 0.2s ease",
    },
    stepList: {
      paddingLeft: "20px",
      margin: 0,
    },
    stepItem: {
      fontSize: "14px",
      color: "#4b5563",
      marginBottom: "12px",
      lineHeight: "1.6",
    },
    stepNumber: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      background: "#667eea",
      color: "white",
      borderRadius: "50%",
      fontSize: "12px",
      fontWeight: "600",
      marginRight: "10px",
    },
    contactCard: {
      background: "#f0f9ff",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #bae6fd",
      textAlign: "center",
    },
    contactTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#0369a1",
      marginBottom: "8px",
    },
    contactText: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "16px",
    },
    contactButton: {
      display: "inline-block",
      background: "#667eea",
      color: "white",
      padding: "10px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      textDecoration: "none",
      border: "none",
      cursor: "pointer",
    },
    issueIcon: {
      fontSize: "20px",
      marginRight: "8px",
    },
  };

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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Help & Support</h1>
        <p style={styles.subtitle}>Find answers to common questions and get started</p>
      </div>

      {/* Getting Started */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🚀</span>
          Getting Started
        </h2>
        <div style={styles.card}>
          <ol style={styles.stepList}>
            {gettingStartedSteps.map((step, index) => (
              <li key={index} style={styles.stepItem}>
                <span style={styles.stepNumber}>{step.number}</span>
                {step.text}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Using Features */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>💡</span>
          Using Features
        </h2>
        <div style={styles.card}>
          {featuresFAQ.map((faq, index) => (
            <div key={index} style={{ borderBottom: index < featuresFAQ.length - 1 ? "1px solid #e5e7eb" : "none", paddingBottom: index < featuresFAQ.length - 1 ? "16px" : "0", marginBottom: index < featuresFAQ.length - 1 ? "16px" : "0" }}>
              <div style={styles.accordionHeader} onClick={() => toggleSection(`feature-${index}`)}>
                <span style={styles.question}>{faq.question}</span>
                <span style={{...styles.arrow, ...getArrowRotation(openSections[`feature-${index}`])}}>▼</span>
              </div>
              {openSections[`feature-${index}`] && (
                <div style={styles.answer}>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>⚠️</span>
          Common Issues
        </h2>
        <div style={styles.card}>
          {commonIssues.map((issue, index) => (
            <div key={index} style={{ borderBottom: index < commonIssues.length - 1 ? "1px solid #e5e7eb" : "none", paddingBottom: index < commonIssues.length - 1 ? "16px" : "0", marginBottom: index < commonIssues.length - 1 ? "16px" : "0" }}>
              <div style={styles.accordionHeader} onClick={() => toggleSection(`issue-${index}`)}>
                <span style={styles.question}>
                  <span style={styles.issueIcon}>{issue.icon}</span>
                  {issue.issue}
                </span>
                <span style={{...styles.arrow, ...getArrowRotation(openSections[`issue-${index}`])}}>▼</span>
              </div>
              {openSections[`issue-${index}`] && (
                <div style={styles.answer}>{issue.solution}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact / Support */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>📧</span>
          Contact / Support
        </h2>
        <div style={styles.contactCard}>
          <div style={styles.contactTitle}>Need more help?</div>
          <p style={styles.contactText}>
            If you can't find the answer you're looking for, feel free to reach out to our support team.
          </p>
          <button style={styles.contactButton} onClick={() => window.location.href = "mailto:support@learningplatform.com"}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default Help;
