import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LearningMaterialPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { learningMaterial, topic, technicalLevel, learningStyle } = location.state || {
    learningMaterial: null,
    topic: "",
    technicalLevel: "",
    learningStyle: ""
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState(null);

  if (!learningMaterial) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>No Learning Material Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Please generate learning material first.</p>
            <button onClick={() => navigate("/result")} className="enterprise-btn">
              ← Back to Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  const downloadMaterial = async () => {
    if (!learningMaterial) return;

    setLoading(true);
    setError("");

    try {
      let content = `${learningMaterial.title || "Learning Material"}\n`;
      content += `${"=".repeat(60)}\n\n`;
      content += `Topic: ${learningMaterial.topic}\n`;
      content += `Level: ${learningMaterial.level}\n`;
      content += `Learning Style: ${learningMaterial.style}\n\n`;

      if (learningMaterial.summary) {
        content += `SUMMARY\n${"-".repeat(40)}\n${learningMaterial.summary}\n\n`;
      }

      if (learningMaterial.sections) {
        learningMaterial.sections.forEach((section, idx) => {
          content += `\n${"=".repeat(60)}\n`;
          content += `${idx + 1}. ${section.title}\n`;
          content += `${"=".repeat(60)}\n\n`;
          content += `${section.content}\n\n`;

          if (section.keyPoints) {
            content += `KEY POINTS:\n`;
            section.keyPoints.forEach(point => {
              content += `  • ${point}\n`;
            });
            content += `\n`;
          }

          if (section.applications) {
            content += `REAL-WORLD APPLICATIONS:\n`;
            section.applications.forEach(app => {
              content += `  • ${app}\n`;
            });
            content += `\n`;
          }

          if (section.examples) {
            content += `EXAMPLES:\n`;
            section.examples.forEach((ex, exIdx) => {
              content += `\n  Example ${exIdx + 1}: ${ex.title}\n`;
              content += `  ${ex.description}\n`;
              if (ex.code) {
                content += `  Code:\n  ${ex.code}\n`;
              }
            });
            content += `\n`;
          }

          if (section.practiceQuestions) {
            content += `PRACTICE QUESTIONS:\n`;
            section.practiceQuestions.forEach((q, qIdx) => {
              content += `  ${qIdx + 1}. ${q}\n`;
            });
            content += `\n`;
          }

          content += `Estimated Time: ${section.estimatedTime}\n`;
        });
      }

      if (learningMaterial.finalProject) {
        content += `\n${"=".repeat(60)}\n`;
        content += `CAPSTONE PROJECT\n${"=".repeat(60)}\n\n`;
        content += `${learningMaterial.finalProject.title}\n`;
        content += `${learningMaterial.finalProject.description}\n\n`;
        content += `STEPS:\n`;
        learningMaterial.finalProject.steps.forEach((step, idx) => {
          content += `  ${idx + 1}. ${step}\n`;
        });
        content += `\nExpected Outcome: ${learningMaterial.finalProject.expectedOutcome}\n`;
      }

      if (learningMaterial.cheatsheet) {
        content += `\n${"=".repeat(60)}\n`;
        content += `QUICK REFERENCE CHEATSHEET\n${"=".repeat(60)}\n\n`;

        if (learningMaterial.cheatsheet.commands) {
          content += `COMMANDS/SYNTAX:\n`;
          learningMaterial.cheatsheet.commands.forEach(cmd => {
            content += `  ${cmd}\n`;
          });
          content += `\n`;
        }

        if (learningMaterial.cheatsheet.definitions) {
          content += `DEFINITIONS:\n`;
          Object.entries(learningMaterial.cheatsheet.definitions).forEach(([term, def]) => {
            content += `  ${term}: ${def}\n`;
          });
        }
      }

      if (learningMaterial.furtherReading) {
        content += `\n${"=".repeat(60)}\n`;
        content += `FURTHER READING & RESOURCES\n${"=".repeat(60)}\n\n`;
        learningMaterial.furtherReading.forEach((resource, idx) => {
          content += `  ${idx + 1}. ${resource}\n`;
        });
      }

      const response = await fetch("http://localhost:5000/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: content,
          filename: (learningMaterial.topic || "learning-material").replace(/\s+/g, "-").toLowerCase()
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadFilename = `${(learningMaterial.topic || "learning-material").replace(/\s+/g, "-").toLowerCase()}-complete-guide.pdf`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      console.log("✅ PDF downloaded successfully");
    } catch (err) {
      console.error("PDF download error:", err);
      setError("Failed to download PDF. Please try again.");
    }

    setLoading(false);
  };

  const generateTestKnowledge = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/generate-quiz-from-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: learningMaterial.topic || topic,
          material: learningMaterial,
          technicalLevel: learningMaterial.level || technicalLevel,
          learningStyle: learningMaterial.style || learningStyle
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const questions = await res.json();
      const quizId = res.headers.get("X-Quiz-Id");
      
      localStorage.setItem("learningMaterialData", JSON.stringify(learningMaterial));
      
      navigate("/quiz", {
        state: {
          questions: questions,
          quizId: quizId,
          fromMaterial: true,
          materialTopic: learningMaterial.topic || topic
        }
      });
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError("Failed to generate quiz. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="content-card" style={{ marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px', textAlign: 'center' }}>
            📚 {learningMaterial.title || "Complete Learning Material"}
          </h1>

          {/* Metadata */}
          <div style={{
            marginBottom: '24px',
            padding: 'var(--space-4)',
            background: 'var(--color-info-light)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid var(--color-info)'
          }}>
            <p style={{ margin: 0, color: 'var(--color-info)', fontWeight: 'var(--font-medium)' }}>
              📌 Topic: <span style={{ color: 'var(--text-primary)' }}>{learningMaterial.topic}</span> | 
              Level: <span style={{ color: 'var(--text-primary)' }}>{learningMaterial.level}</span> | 
              Style: <span style={{ color: 'var(--text-primary)' }}>{learningMaterial.style}</span>
            </p>
          </div>

          {/* Summary */}
          {learningMaterial.summary && (
            <div style={{
              marginBottom: '24px',
              padding: 'var(--space-5)',
              background: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-lg)',
              borderLeft: '4px solid var(--color-primary)'
            }}>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'center' }}>📋 Overview</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                {learningMaterial.summary}
              </p>
            </div>
          )}
        </div>

        {/* Main Content Sections */}
        {learningMaterial.sections && learningMaterial.sections.map((section, idx) => (
          <div key={idx} className="content-card" style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: 'var(--text-primary)',
              marginBottom: '16px',
              fontSize: 'var(--text-xl)',
              textAlign: 'center'
            }}>
              {idx + 1}. {section.title}
            </h3>

            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap',
              textAlign: 'left'
            }}>
              {section.content}
            </p>

            {section.keyPoints && section.keyPoints.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', textAlign: 'center' }}>🔑 Key Points:</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                  {section.keyPoints.map((point, pIdx) => (
                    <li key={pIdx} style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.applications && section.applications.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', textAlign: 'center' }}>🌍 Real-World Applications:</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                  {section.applications.map((app, aIdx) => (
                    <li key={aIdx} style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      {app}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.examples && section.examples.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', textAlign: 'center' }}>💻 Examples & Demonstrations:</h4>
                {section.examples.map((ex, exIdx) => (
                  <div key={exIdx} style={{
                    marginBottom: '16px',
                    padding: 'var(--space-4)',
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {ex.title}
                    </p>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                      {ex.description}
                    </p>
                    {ex.code && (
                      <pre style={{
                        margin: 0,
                        padding: 'var(--space-3)',
                        background: 'var(--color-gray-800)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'auto',
                        fontSize: 'var(--text-sm)'
                      }}>
                        <code style={{ color: '#f8f8f2', fontFamily: 'var(--font-family-mono)' }}>
                          {ex.code}
                        </code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section.practiceQuestions && section.practiceQuestions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', textAlign: 'center' }}>❓ Practice Questions:</h4>
                <ol style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                  {section.practiceQuestions.map((q, qIdx) => (
                    <li key={qIdx} style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p style={{
              margin: '20px 0 0 0',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              borderTop: '1px solid var(--border-color)',
              paddingTop: 'var(--space-4)'
            }}>
              ⏱ Estimated Time: {section.estimatedTime}
            </p>
          </div>
        ))}

        {/* Final Project */}
        {learningMaterial.finalProject && (
          <div className="content-card" style={{
            marginBottom: '24px',
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-xl)',
            color: 'white'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', textAlign: 'center' }}>
              🎯 {learningMaterial.finalProject.title}
            </h3>
            <p style={{ marginBottom: '16px', lineHeight: 'var(--leading-relaxed)' }}>
              {learningMaterial.finalProject.description}
            </p>
            <h5 style={{ marginBottom: '12px', textAlign: 'center' }}>Steps:</h5>
            <ol style={{ paddingLeft: '20px', marginBottom: '16px', textAlign: 'left' }}>
              {learningMaterial.finalProject.steps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
              ))}
            </ol>
            <p style={{ marginTop: '16px', fontWeight: 'var(--font-semibold)' }}>
              ✅ Expected Outcome: {learningMaterial.finalProject.expectedOutcome}
            </p>
          </div>
        )}

        {/* Quick Reference Cheatsheet */}
        {learningMaterial.cheatsheet && (
          <div className="content-card" style={{
            marginBottom: '24px',
            background: 'var(--color-warning-light)',
            borderRadius: 'var(--radius-xl)',
            borderLeft: '4px solid var(--color-warning)'
          }}>
            <h3 style={{ color: '#b45309', marginBottom: '20px', textAlign: 'center' }}>📝 Quick Reference Cheatsheet</h3>

            {learningMaterial.cheatsheet.commands && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ color: '#b45309', marginBottom: '12px', textAlign: 'center' }}>Commands/Syntax:</h5>
                <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                  {learningMaterial.cheatsheet.commands.map((cmd, idx) => (
                    <li key={idx} style={{
                      marginBottom: '8px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      {cmd}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learningMaterial.cheatsheet.definitions && (
              <div>
                <h5 style={{ color: '#b45309', marginBottom: '12px', textAlign: 'center' }}>Definitions & Key Terms:</h5>
                <dl style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
                  {Object.entries(learningMaterial.cheatsheet.definitions).map(([term, def], idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', textAlign: 'left' }}>{term}</dt>
                      <dd style={{ margin: '4px 0 0 20px', color: 'var(--text-secondary)' }}>{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="message error">{error}</p>
        )}

        {/* Bottom Action Buttons */}
        <div className="content-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={downloadMaterial}
              disabled={loading}
              className="enterprise-btn"
            >
              {loading ? "⏳ Downloading..." : "📥 Download PDF"}
            </button>
            <button
              onClick={generateTestKnowledge}
              disabled={loading}
              className="enterprise-btn success"
            >
              {loading ? "⏳ Generating..." : "📝 Take Quiz"}
            </button>
            <button
              onClick={() => navigate("/result")}
              className="enterprise-btn secondary"
            >
              ← Back to Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningMaterialPage;