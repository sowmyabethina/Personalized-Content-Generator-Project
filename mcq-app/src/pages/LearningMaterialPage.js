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
      <div style={{
        minHeight: "75vh",
        background: "#F8FAFC",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="glass-card" style={{ textAlign: "center" }}>
          <h2>No Learning Material Found</h2>
          <p>Please generate learning material first.</p>
          <button onClick={() => navigate("/result")} style={{ marginTop: "20px" }}>
            ← Back to Results
          </button>
        </div>
      </div>
    );
  }

  // Download learning material as PDF
  const downloadMaterial = async () => {
    if (!learningMaterial) return;

    setLoading(true);
    setError("");

    try {
      // Build content string (same format as before, but sent to backend)
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

      // Call backend API to generate PDF
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

      // Get the PDF blob from response
      const blob = await response.blob();
      
      // Create download link and trigger download - force to Downloads folder
      const downloadFilename = `${(learningMaterial.topic || "learning-material").replace(/\s+/g, "-").toLowerCase()}-complete-guide.pdf`;
      
      // Create blob URL with explicit MIME type
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create anchor element for download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      
      // Append to body, click, and remove - this triggers native browser download
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay to ensure download starts
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

  // Generate quiz from learning material
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
      
      // Store learning material in localStorage for retrieval after quiz
      localStorage.setItem("learningMaterialData", JSON.stringify(learningMaterial));
      
      // Navigate to quiz page with generated questions
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
    <div style={{
      minHeight: "75vh",
      background: "#F8FAFC",
      padding: "20px"
    }}>
      <div className="glass-card" style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        padding: "30px"
      }}>
        

        {/* Header */}
        <h1 style={{ color: "#2c3e50", marginBottom: "10px", textAlign: "center" }}>
          📚 {learningMaterial.title || "Complete Learning Material"}
        </h1>

        {/* Metadata Card */}
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          background: "#E3F2FD",
          borderRadius: "8px",
          borderLeft: "4px solid #1976D2"
        }}>
          <p style={{ margin: "0", color: "#1976D2", fontWeight: "bold" }}>
            📌 Topic: <span style={{ color: "#333" }}>{learningMaterial.topic}</span> | 
            Level: <span style={{ color: "#333" }}>{learningMaterial.level}</span> | 
            Style: <span style={{ color: "#333" }}>{learningMaterial.style}</span>
          </p>
        </div>

        {/* Summary Section */}
        {learningMaterial.summary && (
          <div style={{
            marginBottom: "30px",
            padding: "20px",
            background: "#F8FAFC",
            borderRadius: "8px",
            borderLeft: "4px solid #2563EB"
          }}>
            <h2 style={{ color: "#1E293B", marginBottom: "15px", textAlign: "center" }}>📋 Overview</h2>
            <p style={{ color: "#475569", lineHeight: "1.8", margin: "0" }}>
              {learningMaterial.summary}
            </p>
          </div>
        )}

        

        {/* Main Content Sections */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#1E293B", marginBottom: "20px", textAlign: "center" }}>📖 Course Content</h2>

          {learningMaterial.sections && learningMaterial.sections.map((section, idx) => (
            <div key={idx} style={{
              marginBottom: "30px",
              padding: "25px",
              background: "#FFFFFF",
              borderRadius: "8px",
              borderLeft: "4px solid #2563EB",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{
                color: "#1E293B",
                marginBottom: "15px",
                fontSize: "20px",
                textAlign: "center"
              }}>
                {idx + 1}. {section.title}
              </h3>

              {/* Main Content */}
              <p style={{
                color: "#475569",
                lineHeight: "1.8",
                marginBottom: "20px",
                whiteSpace: "pre-wrap",
                textAlign: "left"
              }}>
                {section.content}
              </p>

              {/* Key Points */}
              {section.keyPoints && section.keyPoints.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#2563EB", marginBottom: "10px", textAlign: "center" }}>🔑 Key Points:</h4>
                  <ul style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
                    {section.keyPoints.map((point, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: "8px", color: "#475569", textAlign: "left" }}>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-World Applications */}
              {section.applications && section.applications.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#2563EB", marginBottom: "10px", textAlign: "center" }}>🌍 Real-World Applications:</h4>
                  <ul style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
                    {section.applications.map((app, aIdx) => (
                      <li key={aIdx} style={{ marginBottom: "8px", color: "#475569", textAlign: "left" }}>
                        {app}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {section.examples && section.examples.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#2563EB", marginBottom: "10px", textAlign: "center" }}>💻 Examples & Demonstrations:</h4>
                  {section.examples.map((ex, exIdx) => (
                    <div key={exIdx} style={{
                      marginBottom: "15px",
                      padding: "15px",
                      background: "#F8FAFC",
                      borderRadius: "4px",
                      border: "1px solid #E2E8F0"
                    }}>
                      <p style={{
                        margin: "0 0 8px 0",
                        fontWeight: "bold",
                        color: "#1E293B"
                      }}>
                        {ex.title}
                      </p>
                      <p style={{
                        margin: "0 0 10px 0",
                        color: "#475569",
                        fontSize: "14px"
                      }}>
                        {ex.description}
                      </p>
                      {ex.code && (
                        <pre style={{
                          margin: "10px 0 0 0",
                          padding: "12px",
                          background: "#1E293B",
                          borderRadius: "4px",
                          overflow: "auto",
                          fontSize: "12px"
                        }}>
                          <code style={{ color: "#F8FAFC" }}>
                            {ex.code}
                          </code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Practice Questions */}
              {section.practiceQuestions && section.practiceQuestions.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "#2563EB", marginBottom: "10px", textAlign: "center" }}>❓ Practice Questions:</h4>
                  <ol style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
                    {section.practiceQuestions.map((q, qIdx) => (
                      <li key={qIdx} style={{ marginBottom: "8px", color: "#475569", textAlign: "left" }}>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Estimated Time */}
              <p style={{
                margin: "20px 0 0 0",
                color: "#64748B",
                fontSize: "13px",
                borderTop: "1px solid #E2E8F0",
                paddingTop: "15px"
              }}>
                ⏱ Estimated Time: {section.estimatedTime}
              </p>
            </div>
          ))}
        </div>

        {/* Final Project */}
        {learningMaterial.finalProject && (
          <div style={{
            marginBottom: "30px",
            padding: "25px",
            background: "#2563EB",
            borderRadius: "8px",
            color: "#FFFFFF"
          }}>
            <h3 style={{ marginTop: "0", marginBottom: "15px", textAlign: "center" }}>
              🎯 {learningMaterial.finalProject.title}
            </h3>
            <p style={{ marginBottom: "15px", lineHeight: "1.6" }}>
              {learningMaterial.finalProject.description}
            </p>
            <h5 style={{ marginBottom: "10px", textAlign: "center" }}>Steps:</h5>
            <ol style={{ paddingLeft: "20px", marginBottom: "15px", textAlign: "left" }}>
              {learningMaterial.finalProject.steps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: "8px", textAlign: "left" }}>{step}</li>
              ))}
            </ol>
            <p style={{ marginTop: "15px", fontWeight: "bold" }}>
              ✅ Expected Outcome: {learningMaterial.finalProject.expectedOutcome}
            </p>
          </div>
        )}

        {/* Quick Reference Cheatsheet */}
        {learningMaterial.cheatsheet && (
          <div style={{
            marginBottom: "30px",
            padding: "25px",
            background: "#FEF3C7",
            borderRadius: "8px",
            borderLeft: "4px solid #D97706"
          }}>
            <h3 style={{ color: "#92400E", marginBottom: "20px", textAlign: "center" }}>📝 Quick Reference Cheatsheet</h3>

            {learningMaterial.cheatsheet.commands && (
              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#92400E", marginBottom: "10px", textAlign: "center" }}>Commands/Syntax:</h5>
                <ul style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
                  {learningMaterial.cheatsheet.commands.map((cmd, idx) => (
                    <li key={idx} style={{
                      marginBottom: "8px",
                      color: "#475569",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      textAlign: "left"
                    }}>
                      {cmd}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learningMaterial.cheatsheet.definitions && (
              <div>
                <h5 style={{ color: "#92400E", marginBottom: "10px", textAlign: "center" }}>Definitions & Key Terms:</h5>
                <dl style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
                  {Object.entries(learningMaterial.cheatsheet.definitions).map(([term, def], idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <dt style={{ fontWeight: "bold", color: "#1E293B", textAlign: "left" }}>{term}</dt>
                      <dd style={{ margin: "4px 0 0 20px", color: "#475569", textAlign: "left" }}>{def}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Further Reading */}
        {learningMaterial.furtherReading && learningMaterial.furtherReading.length > 0 && (
          <div style={{
            marginBottom: "30px",
            padding: "25px",
            background: "#F0F9FF",
            borderRadius: "8px",
            borderLeft: "4px solid #0284C7"
          }}>
            <h3 style={{ color: "#0369A1", marginBottom: "15px", textAlign: "center" }}>📖 Further Reading & Resources</h3>
            <ul style={{ paddingLeft: "20px", margin: "0", textAlign: "left" }}>
              {learningMaterial.furtherReading.map((resource, idx) => (
                <li key={idx} style={{ marginBottom: "8px", color: "#475569", textAlign: "left" }}>
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
          marginTop: "30px",
          borderTop: "2px solid #E2E8F0",
          paddingTop: "20px"
        }}>
          <button
            onClick={downloadMaterial}
            style={{
              padding: "16px",
              fontSize: "16px",
              background: "#059669",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Download Learning Material
          </button>

          <button
            onClick={generateTestKnowledge}
            disabled={loading}
            style={{
              padding: "16px",
              fontSize: "16px",
              background: loading ? "#94A3B8" : "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600"
            }}
          >
            {loading ? "Generating Quiz..." : "Test Your Knowledge"}
          </button>
        </div>

        {/* Action Links */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
      
          <button
            onClick={() => navigate("/result")}
            style={{
              padding: "12px 24px",
              fontSize: "14px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#475569",
              fontWeight: "500"
            }}
          >
            ← Back to Results
          </button>
        </div>

        {error && (
          <p style={{
            color: "#DC2626",
            marginTop: "20px",
            padding: "12px",
            background: "#FEE2E2",
            borderRadius: "8px"
          }}>
            ❌ {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default LearningMaterialPage;
