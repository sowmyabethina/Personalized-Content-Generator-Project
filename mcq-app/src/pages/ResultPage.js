import { useState, useEffect } from "react";
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
    mode,
    // Analysis data passed from QuizPage/HomePage
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
  const effectiveCombinedAnalysis = combinedAnalysis || location.state?.combinedData || null;

  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);

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
        topic: topic || null,
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
            topic: topic || null,
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
          topic: topic || "General Technology",
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
      
      // Save analysis to database (background, doesn't block UI)
      const roadmapData = {
        learningPath: material.sections?.map(s => `${s.title}: ${s.keyPoints?.join(", ")}`) || [],
        tips: material.learningTips || [],
        finalProject: material.finalProject
      };
      saveAnalysisToDatabase(material, roadmapData);
      
      // Navigate to LearningMaterialPage instead of showing inline
      navigate("/learning-material", {
        state: {
          learningMaterial: material,
          topic: topic,
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

        {!showContent ? (
          <>
            <button
              onClick={generateContent}
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                marginBottom: "15px",
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
              }}
            >
              {loading ? "Generating..." : "🚀 Generate Personalized Learning Path"}
            </button>

            {/* Back Button */}
            <button
              onClick={() => navigate("/quiz")}
              style={{ marginBottom: "20px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "10px 20px", cursor: "pointer", borderRadius: "8px", color: "#374151", fontSize: "14px", fontWeight: "500" }}
            >
              ↩️ Back to Quiz
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

                {/* Generate Full Learning Material Button */}
                <button
                  onClick={generateLearningMaterial}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "18px",
                    fontSize: "18px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    marginTop: "20px",
                    marginBottom: "15px"
                  }}
                >
                  {loading ? "Generating..." : "📚 Generate Full Learning Material"}
                </button>
              </>
            )}

            <div style={{ display: "flex", gap: "15px", marginTop: "30px", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/pdf-chat")} style={{ flex: "1", minWidth: "150px" }}>
                💬 Chat with PDF
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
