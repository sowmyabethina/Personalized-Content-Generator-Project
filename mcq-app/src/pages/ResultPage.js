import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    score,
    correctCount,
    questions,
    topic,
    technicalScore,
    learningScore,
    combinedAnalysis,
    mode
  } = location.state || {
    score: 0,
    correctCount: 0,
    questions: [],
    topic: "",
    technicalScore: 0,
    learningScore: 0,
    combinedAnalysis: null,
    mode: "direct"
  };

  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);

  // Determine levels
  const getTechnicalLevel = () => {
    const techScore = technicalScore || score;
    if (techScore >= 80) return "Advanced";
    if (techScore >= 60) return "Intermediate";
    return "Beginner";
  };

  const getLearningStyle = () => {
    const learnScore = learningScore || 50;
    if (learnScore >= 60) return "Hands-On Learner";
    if (learnScore >= 40) return "Balanced Learner";
    return "Theory-First Learner";
  };

  // Generate personalized content using combined analysis
  const generateContent = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/generate-combined-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "General Technology",
          technicalLevel: getTechnicalLevel(),
          technicalScore: technicalScore || score,
          learningStyle: getLearningStyle(),
          learningScore: learningScore || 50,
          combinedAnalysis: combinedAnalysis?.combinedAnalysis || ""
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const content = await res.json();
      setPersonalizedContent(content);
      setShowContent(true);
    } catch (err) {
      console.error("Content generation error:", err);
      setError("Failed to generate personalized content");
    }

    setLoading(false);
  };

  // Generate exact learning material
  const generateLearningMaterial = async () => {
    setLoadingMaterial(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/generate-learning-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "General Technology",
          technicalLevel: getTechnicalLevel(),
          learningStyle: getLearningStyle()
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const material = await res.json();
      setLearningMaterial(material);
      setShowMaterial(true);
      setShowContent(false);
    } catch (err) {
      console.error("Learning material error:", err);
      setError("Failed to generate learning material");
    }

    setLoadingMaterial(false);
  };

  // Quiz score card
  const renderQuizScore = () => {
    if (mode === "quiz" && score !== undefined) {
      return (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
          color: "white"
        }}>
          <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 10px 0" }}>Quiz Score</p>
          <p style={{ fontSize: "36px", fontWeight: "bold", margin: "0" }}>{score}%</p>
          <p style={{ fontSize: "14px", margin: "10px 0 0 0", opacity: 0.9 }}>
            {correctCount}/{questions.length} correct
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
      padding: "20px"
    }}>
      <div className="card" style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        padding: "40px"
      }}>
        <h2 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "20px" }}>
          🏆 Assessment Complete
        </h2>

        {topic && (
          <p style={{ textAlign: "center", color: "#667eea", fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
            Topic: {topic}
          </p>
        )}

        {/* Technical Score */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            padding: "25px",
            color: "white",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 10px 0" }}>Technical Knowledge</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0" }}>{technicalScore || score}%</p>
            <p style={{ fontSize: "14px", margin: "10px 0 0 0", opacity: 0.9 }}>Level: {getTechnicalLevel()}</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            borderRadius: "12px",
            padding: "25px",
            color: "white",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 10px 0" }}>Learning Preference</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0" }}>{learningScore || 50}%</p>
            <p style={{ fontSize: "14px", margin: "10px 0 0 0", opacity: 0.9 }}>Style: {getLearningStyle()}</p>
          </div>
        </div>

        {renderQuizScore()}

        {/* Combined Analysis */}
        {combinedAnalysis && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            borderLeft: "4px solid #667eea",
            textAlign: "left"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>📊 Combined Analysis</h4>
            <p style={{ margin: "0", color: "#555", lineHeight: "1.6" }}>
              {combinedAnalysis.combinedAnalysis}
            </p>
          </div>
        )}

        {!showContent && !showMaterial ? (
          <>
            <button
              onClick={generateContent}
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                marginBottom: "15px"
              }}
            >
              {loading ? "Generating..." : "🚀 Generate Personalized Learning Path"}
            </button>

            <button
              onClick={generateLearningMaterial}
              disabled={loadingMaterial}
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                marginBottom: "15px"
              }}
            >
              {loadingMaterial ? "Generating..." : "📚 View Learning Material"}
            </button>

            <button
              onClick={() => navigate("/pdf-chat")}
              style={{ width: "100%", padding: "15px", marginBottom: "15px" }}
            >
              📄 Chat with PDF Documents
            </button>

            <button
              onClick={() => navigate("/quiz")}
              style={{ width: "100%", padding: "15px", background: "#9C27B0" }}
            >
              🔄 Start New Assessment
            </button>
          </>
        ) : (
          <div style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "30px",
            textAlign: "left"
          }}>
            {personalizedContent && (
              <>
                <h3 style={{ color: "#2c3e50", marginBottom: "20px" }}>
                  {personalizedContent.title || "Your Personalized Learning Guide"}
                </h3>

                {personalizedContent.overview && (
                  <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.6", marginBottom: "25px" }}>
                    {personalizedContent.overview}
                  </p>
                )}

                {personalizedContent.learningPath && (
                  <div style={{ marginBottom: "25px" }}>
                    <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>📋 Learning Path:</h4>
                    <ol style={{ paddingLeft: "20px", color: "#555" }}>
                      {personalizedContent.learningPath.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: "10px" }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {personalizedContent.resources && (
                  <div style={{ marginBottom: "25px" }}>
                    <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>📚 Resources:</h4>
                    {personalizedContent.resources.map((resource, idx) => (
                      <div key={idx} style={{
                        background: "#ffffff",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        borderLeft: "4px solid #667eea"
                      }}>
                        <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#667eea" }}>
                          {resource.type}: {resource.title}
                        </p>
                        <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                          {resource.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {personalizedContent.tips && (
                  <div style={{ marginBottom: "25px" }}>
                    <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>💡 Tips:</h4>
                    <ul style={{ paddingLeft: "20px", color: "#555" }}>
                      {personalizedContent.tips.map((tip, idx) => (
                        <li key={idx} style={{ marginBottom: "8px" }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {personalizedContent.nextSteps && (
                  <div style={{
                    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    padding: "20px",
                    borderRadius: "8px",
                    color: "white",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}>
                      🚀 {personalizedContent.nextSteps}
                    </p>
                  </div>
                )}

                {/* Download Learning Material Button */}
                <button
                  onClick={generateLearningMaterial}
                  disabled={loadingMaterial}
                  style={{
                    width: "100%",
                    padding: "18px",
                    fontSize: "18px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    marginTop: "20px",
                    marginBottom: "15px"
                  }}
                >
                  {loadingMaterial ? "Generating..." : "📥 Download Complete Learning Material"}
                </button>
              </>
            )}

            <div style={{ display: "flex", gap: "15px", marginTop: "30px", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/pdf-chat")} style={{ flex: "1", minWidth: "150px" }}>
                📄 PDF Chat
              </button>
              <button onClick={() => navigate("/quiz")} style={{ flex: "1", minWidth: "150px", background: "#9C27B0" }}>
                🔄 New Assessment
              </button>
            </div>
          </div>
        )}

        {/* Learning Material Display */}
        {showMaterial && learningMaterial && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "30px",
            textAlign: "left"
          }}>
            <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>
              📚 {learningMaterial.title || "Complete Learning Material"}
            </h2>

            <div style={{ marginBottom: "20px", padding: "15px", background: "#E3F2FD", borderRadius: "8px" }}>
              <p style={{ margin: "0", color: "#1976D2", fontWeight: "bold" }}>
                📌 Topic: {learningMaterial.topic} | Level: {learningMaterial.level} | Style: {learningMaterial.style}
              </p>
            </div>

            {learningMaterial.summary && (
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ color: "#2c3e50" }}>📋 Summary</h4>
                <p style={{ color: "#555", lineHeight: "1.6" }}>{learningMaterial.summary}</p>
              </div>
            )}

            {learningMaterial.sections && learningMaterial.sections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: "30px", padding: "20px", background: "#fff", borderRadius: "8px", borderLeft: "4px solid #667eea" }}>
                <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                  📖 {section.title}
                </h3>
                <p style={{ color: "#555", lineHeight: "1.8", marginBottom: "15px" }}>
                  {section.content}
                </p>

                {section.keyPoints && (
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: "#667eea", marginBottom: "10px" }}>🔑 Key Points:</h5>
                    <ul style={{ paddingLeft: "20px", color: "#555" }}>
                      {section.keyPoints.map((point, pIdx) => (
                        <li key={pIdx} style={{ marginBottom: "5px" }}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.examples && section.examples.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: "#667eea", marginBottom: "10px" }}>💻 Examples:</h5>
                    {section.examples.map((ex, exIdx) => (
                      <div key={exIdx} style={{ marginBottom: "10px", padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>
                        <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#333" }}>{ex.title}</p>
                        <p style={{ margin: "0 0 5px 0", color: "#666" }}>{ex.description}</p>
                        {ex.code && (
                          <pre style={{ margin: "10px 0 0 0", padding: "10px", background: "#2c3e50", borderRadius: "4px", overflow: "auto" }}>
                            <code style={{ color: "#f8f8f2", fontSize: "13px" }}>{ex.code}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.practiceQuestions && (
                  <div style={{ marginBottom: "10px" }}>
                    <h5 style={{ color: "#667eea", marginBottom: "10px" }}>❓ Practice Questions:</h5>
                    <ul style={{ paddingLeft: "20px", color: "#555" }}>
                      {section.practiceQuestions.map((q, qIdx) => (
                        <li key={qIdx} style={{ marginBottom: "5px" }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: "13px" }}>
                  ⏱ Estimated Time: {section.estimatedTime}
                </p>
              </div>
            ))}

            {learningMaterial.finalProject && (
              <div style={{ marginBottom: "30px", padding: "20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "8px", color: "white" }}>
                <h3 style={{ marginBottom: "15px" }}>🎯 {learningMaterial.finalProject.title}</h3>
                <p style={{ marginBottom: "15px" }}>{learningMaterial.finalProject.description}</p>
                <h5 style={{ marginBottom: "10px" }}>Steps:</h5>
                <ol style={{ paddingLeft: "20px" }}>
                  {learningMaterial.finalProject.steps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: "5px" }}>{step}</li>
                  ))}
                </ol>
                <p style={{ marginTop: "15px", fontWeight: "bold" }}>
                  ✅ {learningMaterial.finalProject.expectedOutcome}
                </p>
              </div>
            )}

            {learningMaterial.cheatsheet && (
              <div style={{ marginBottom: "30px", padding: "20px", background: "#FFF3E0", borderRadius: "8px" }}>
                <h3 style={{ color: "#E65100", marginBottom: "15px" }}>📝 Quick Reference</h3>
                {learningMaterial.cheatsheet.commands && (
                  <div style={{ marginBottom: "15px" }}>
                    <h5 style={{ color: "#E65100" }}>Commands/Syntax:</h5>
                    <ul style={{ paddingLeft: "20px", color: "#555" }}>
                      {learningMaterial.cheatsheet.commands.map((cmd, idx) => (
                        <li key={idx} style={{ marginBottom: "5px", fontFamily: "monospace" }}>{cmd}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {learningMaterial.cheatsheet.definitions && (
                  <div>
                    <h5 style={{ color: "#E65100" }}>Definitions:</h5>
                    <dl style={{ paddingLeft: "20px", color: "#555" }}>
                      {Object.entries(learningMaterial.cheatsheet.definitions).map(([term, def], idx) => (
                        <div key={idx} style={{ marginBottom: "5px" }}>
                          <dt style={{ fontWeight: "bold", display: "inline" }}>{term}:</dt>
                          <dd style={{ display: "inline", marginLeft: "5px" }}>{def}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {learningMaterial.furtherReading && (
              <div style={{ marginBottom: "25px" }}>
                <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>📖 Further Reading</h4>
                <ul style={{ paddingLeft: "20px", color: "#555" }}>
                  {learningMaterial.furtherReading.map((resource, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{resource}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", gap: "15px", marginTop: "30px", flexWrap: "wrap" }}>
              <button onClick={() => { setShowMaterial(false); setShowContent(true); }} style={{ flex: "1", minWidth: "150px", background: "#4CAF50" }}>
                ← Back to Learning Path
              </button>
              <button onClick={() => navigate("/pdf-chat")} style={{ flex: "1", minWidth: "150px" }}>
                📄 PDF Chat
              </button>
              <button onClick={() => navigate("/quiz")} style={{ flex: "1", minWidth: "150px", background: "#9C27B0" }}>
                🔄 New Assessment
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: "#e74c3c", textAlign: "center", marginTop: "20px", padding: "10px", background: "#fdeaea", borderRadius: "8px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
