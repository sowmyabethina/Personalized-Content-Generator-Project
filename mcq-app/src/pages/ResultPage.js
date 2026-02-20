import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Debug log to verify component is loaded
console.log("ACTIVE RESULTS COMPONENT LOADED");

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
    mode, // Analysis data passed from QuizPage/HomePage
    userId,
    sourceType,
    sourceUrl,
    extractedText,
    skills,
    strengths,
    weakAreas
  } = location.state || {
    score: 0,
    correctCount: 0,
    questions: [],
    topic: "",
    technicalScore: 0,
    learningScore: 0,
    combinedAnalysis: null,
    mode: "direct",
    userId: null,
    sourceType: "resume",
    sourceUrl: null,
    extractedText: null,
    skills: [],
    strengths: [],
    weakAreas: []
  };

  // Handle backward compatibility (combinedData -> combinedAnalysis)
  const effectiveCombinedAnalysis =
    combinedAnalysis || location.state?.combinedData || null;

  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [learningTopic, setLearningTopic] = useState(topic || "");

  // Determine levels
  const getTechnicalLevel = () => {
    const techScore = technicalScore || score;
    if (techScore >= 80) return "Advanced";
    if (techScore >= 60) return "Intermediate";
    return "Beginner";
  };

  const getLearningStyle = () => {
    const learnScore = learningScore || 50;
    if (learnScore >= 70) return "Hands-On Learner";
    if (learnScore >= 35) return "Balanced Learner";
    return "Theory-First Learner";
  };

  // Save analysis to database
  const saveAnalysisToDatabase = async (contentData, roadmapData) => {
    try {
      const existingAnalysisId = localStorage.getItem("currentAnalysisId");
      const analysisData = {
        userId: userId || "anonymous",
        sourceType: sourceType || "resume",
        sourceUrl: sourceUrl || null,
        extractedText: extractedText || null,
        skills: skills || [],
        strengths: strengths || [],
        weakAreas: weakAreas || [],
        aiRecommendations: contentData?.resources || contentData?.tips || [],
        learningRoadmap: roadmapData || contentData?.learningPath || null,
        technicalLevel: getTechnicalLevel(),
        learningStyle: getLearningStyle(),
        overallScore: technicalScore || score || 0,
        topic: learningTopic || topic || null,
        learningScore: learningScore || null,
        technicalScore: technicalScore || score || null,
        psychometricProfile: combinedAnalysis?.psychometricProfile || null
      };

      // If we have an existing analysis, update it
      if (existingAnalysisId) {
        await fetch(`http://localhost:5000/analysis/${existingAnalysisId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skills: skills || [],
            strengths: strengths || [],
            weakAreas: weakAreas || [],
            aiRecommendations: contentData?.resources || contentData?.tips || [],
            learningRoadmap: roadmapData || contentData?.learningPath || null,
            technicalLevel: getTechnicalLevel(),
            learningStyle: getLearningStyle(),
            topic: learningTopic || topic || null,
            learningScore: learningScore || null,
            technicalScore: technicalScore || score || null,
            psychometricProfile: combinedAnalysis?.psychometricProfile || null
          })
        });
        setAnalysisId(existingAnalysisId);
        console.log("✅ Analysis updated:", existingAnalysisId);
      } else {
        // Create new analysis
        const saveRes = await fetch("http://localhost:5000/save-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analysisData)
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          setAnalysisId(saveData.analysisId);
          localStorage.setItem("currentAnalysisId", saveData.analysisId);
          console.log("✅ Analysis saved with ID:", saveData.analysisId);
        }
      }
    } catch (saveErr) {
      console.error("Failed to save analysis:", saveErr);
    }
  };

  // Generate personalized content using combined analysis
  const generateContent = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Fetching combined content...");
      const res = await fetch("http://localhost:5000/generate-combined-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: learningTopic || topic || "General Technology",
          technicalLevel: getTechnicalLevel(),
          technicalScore: technicalScore || score,
          learningStyle: getLearningStyle(),
          learningScore: learningScore || 50,
          combinedAnalysis: combinedAnalysis?.combinedAnalysis || ""
        })
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const content = await res.json();
      console.log("Content received:", content);

      setPersonalizedContent(content);
      setShowContent(true);

      // Save analysis to database (background, doesn't block UI)
      saveAnalysisToDatabase(content, content.learningPath);
    } catch (err) {
      console.error("Content generation error:", err);
      setError("Failed to generate personalized content");
    }

    setLoading(false);
  };

  // Generate exact learning material
  const generateLearningMaterial = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/generate-learning-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: learningTopic || topic || "General Technology",
          technicalLevel: getTechnicalLevel(),
          learningStyle: getLearningStyle()
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const material = await res.json();
      setLearningMaterial(material);

      // Save analysis to database (background, doesn't block UI)
      const roadmapData = {
        learningPath:
          material.sections?.map(s => `${s.title}: ${s.keyPoints?.join(", ")}`) ||
          [],
        tips: material.learningTips || [],
        finalProject: material.finalProject
      };
      saveAnalysisToDatabase(material, roadmapData);

      // Navigate to LearningMaterialPage instead of showing inline
      navigate("/learning-material", {
        state: {
          learningMaterial: material,
          topic: learningTopic || topic,
          technicalLevel: getTechnicalLevel(),
          learningStyle: getLearningStyle(),
          analysisId: analysisId
        }
      });
    } catch (err) {
      console.error("Learning material error:", err);
      setError("Failed to generate learning material. Please try again.");
    }

    setLoading(false);
  };

  // Quiz score card
  const renderQuizScore = () => {
    if (mode === "quiz" && score !== undefined) {
      return (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "16px",
            color: "#1E293B",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 6px 0" }}>
            Quiz Score
          </p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: "0",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#1E293B"
            }}
          >
            {score}%
          </p>
          <p style={{ fontSize: "13px", margin: "6px 0 0 0", color: "#475569" }}>
            {correctCount}/{questions.length} correct
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#F8FAFC",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          minHeight: "auto",
          margin: "0 auto",
          background: "#FFFFFF",
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          padding: "28px 32px",
          paddingBottom: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              color: "#1E293B",
              margin: "0 0 6px 0",
              fontSize: "24px",
              fontWeight: "700"
            }}
          >
            Your Learning Profile is Ready
          </h2>
          <p
            style={{
              color: "#475569",
              fontSize: "13px",
              margin: "0"
            }}
          >
            We've analyzed your skills and learning style to build the perfect path for you.
          </p>
        </div>

        {/* Topic Badge */}
        {topic && (
          <span
            style={{
              padding: "6px 18px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#1E40AF",
              background: "#DBEAFE",
              borderRadius: "50px",
              border: "none"
            }}
          >
            Topic: {topic}
          </span>
        )}

        {/* Score Cards - Compact Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
            width: "100%"
          }}
        >
          {/* Technical Score Card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "18px",
              color: "#1E293B",
              textAlign: "center",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#475569",
                margin: "0 0 10px 0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600"
              }}
            >
              Technical Score
            </p>
            <div
              style={{
                position: "relative",
                width: "80px",
                height: "80px",
                margin: "0 auto"
              }}
            >
              <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(technicalScore || score || 0) * 2.14} 214`}
                  style={{
                    transition: "stroke-dasharray 1s ease-out"
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "'Courier New', Courier, monospace",
                  color: "#1E293B"
                }}
              >
                {technicalScore || score}%
              </div>
            </div>
            <p style={{ fontSize: "11px", margin: "10px 0 0 0" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "10px",
                  background:
                    getTechnicalLevel() === "Advanced"
                      ? "#DCFCE7"
                      : getTechnicalLevel() === "Intermediate"
                      ? "#FEF3C7"
                      : "#FEE2E2",
                  color:
                    getTechnicalLevel() === "Advanced"
                      ? "#166534"
                      : getTechnicalLevel() === "Intermediate"
                      ? "#92400E"
                      : "#DC2626",
                  fontWeight: "600"
                }}
              >
                {getTechnicalLevel()}
              </span>
            </p>
          </div>

          {/* Learning Preference Card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "18px",
              color: "#1E293B",
              textAlign: "center",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#475569",
                margin: "0 0 10px 0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "600"
              }}
            >
              Learning Preference
            </p>
            <div
              style={{
                position: "relative",
                width: "80px",
                height: "80px",
                margin: "0 auto"
              }}
            >
              <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(learningScore || 50) * 2.14} 214`}
                  style={{
                    transition: "stroke-dasharray 1s ease-out"
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "'Courier New', Courier, monospace",
                  color: "#1E293B"
                }}
              >
                {learningScore || 50}%
              </div>
            </div>
            <p style={{ fontSize: "11px", margin: "10px 0 0 0" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "10px",
                  background:
                    getLearningStyle() === "Hands-On Learner"
                      ? "#DCFCE7"
                      : "#DBEAFE",
                  color:
                    getLearningStyle() === "Hands-On Learner"
                      ? "#166534"
                      : "#1E40AF",
                  fontWeight: "600"
                }}
              >
                {getLearningStyle()}
              </span>
            </p>
          </div>
        </div>

        {renderQuizScore()}

        {/* Combined Analysis */}
        {combinedAnalysis && (
          <div
            style={{
              background: "#F0F9FF",
              borderRadius: "10px",
              padding: "14px 16px",
              borderLeft: "4px solid #38BDF8",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              textAlign: "left",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <h4
              style={{
                margin: "0 0 4px 0",
                color: "#1E293B",
                fontWeight: "600",
                fontSize: "12px"
              }}
            >
              📊 Combined Analysis
            </h4>
            <p
              style={{
                margin: "0",
                color: "#475569",
                lineHeight: "1.5",
                fontSize: "13px"
              }}
            >
              {combinedAnalysis.combinedAnalysis}
            </p>
          </div>
        )}

        {/* CTA Section */}
        {!showContent ? (
          <>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: "4px"
              }}
            >
              <button
                onClick={generateContent}
                disabled={loading}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "14px 28px",
                  fontSize: "15px",
                  background: "#2563EB",
                  border: "none",
                  borderRadius: "10px",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                }}
              >
                {loading ? "Generating..." : "Generate Personalized Learning Path"}
              </button>
            </div>

            {/* Retake Quiz Button */}
            <button
              onClick={() => navigate("/quiz")}
              style={{
                background: "transparent",
                border: "none",
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: "6px",
                color: "#2563EB",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.3s ease"
              }}
            >
              🔄 Retake Quiz
            </button>
          </>
        ) : (
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "left",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            {personalizedContent && (
              <>
                <h3 style={{ color: "#1E293B", marginBottom: "16px", fontSize: "18px" }}>
                  {personalizedContent.title || "Your Personalized Learning Guide"}
                </h3>

                {personalizedContent.overview && (
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      marginBottom: "20px"
                    }}
                  >
                    {personalizedContent.overview}
                  </p>
                )}

                {personalizedContent.learningPath && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#1E293B", marginBottom: "12px", fontSize: "14px" }}>
                      📋 Learning Path:
                    </h4>
                    <ol style={{ paddingLeft: "18px", color: "#475569", margin: 0 }}>
                      {personalizedContent.learningPath.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: "8px", fontSize: "13px" }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {personalizedContent.resources && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#1E293B", marginBottom: "12px", fontSize: "14px" }}>
                      📚 Resources:
                    </h4>
                    {personalizedContent.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#FFFFFF",
                          padding: "12px",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          borderLeft: "3px solid #2563EB"
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontWeight: "bold",
                            color: "#2563EB",
                            fontSize: "13px"
                          }}
                        >
                          {resource.type}: {resource.title}
                        </p>
                        <p style={{ margin: "0", color: "#475569", fontSize: "12px" }}>
                          {resource.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {personalizedContent.tips && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#1E293B", marginBottom: "12px", fontSize: "14px" }}>
                      💡 Tips:
                    </h4>
                    <ul style={{ paddingLeft: "18px", color: "#475569", margin: 0 }}>
                      {personalizedContent.tips.map((tip, idx) => (
                        <li key={idx} style={{ marginBottom: "6px", fontSize: "13px" }}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {personalizedContent.nextSteps && (
                  <div
                    style={{
                      background: "#DCFCE7",
                      padding: "14px",
                      borderRadius: "8px",
                      color: "#166534",
                      textAlign: "center"
                    }}
                  >
                    <p style={{ margin: "0", fontSize: "14px", fontWeight: "bold" }}>
                      🚀 {personalizedContent.nextSteps}
                    </p>
                  </div>
                )}

                {/* Generate Full Learning Material Button */}
                <button
                  onClick={generateLearningMaterial}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "15px",
                    background: "#2563EB",
                    border: "none",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "16px",
                    marginBottom: "12px"
                  }}
                >
                  {loading ? "Generating..." : "📚 Generate Full Learning Material"}
                </button>
              </>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
                flexWrap: "wrap"
              }}
            >
              <button
                onClick={() => navigate("/pdf-chat")}
                style={{
                  flex: "1",
                  minWidth: "130px",
                  padding: "10px",
                  background: "#2563EB",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                💬 Chat with PDF
              </button>
              <button
                onClick={() => navigate("/quiz")}
                style={{
                  flex: "1",
                  minWidth: "130px",
                  background: "#64748B",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                🔄 New Assessment
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            style={{
              color: "#DC2626",
              textAlign: "center",
              marginTop: "12px",
              padding: "8px",
              background: "#FEE2E2",
              borderRadius: "6px",
              fontSize: "13px"
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
