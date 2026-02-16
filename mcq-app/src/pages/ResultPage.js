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
    weakAreas,
    // Quiz answers for detailed analysis
    quizAnswers
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
    weakAreas: [],
    quizAnswers: []
  };

  // Handle backward compatibility (combinedData -> combinedAnalysis)
  const effectiveCombinedAnalysis = combinedAnalysis || location.state?.combinedData || null;

  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);

  // Analyze quiz results to derive strengths and areas to improve
  const analyzeQuizResults = () => {
    const topicPerformance = {
      correct: [],
      incorrect: []
    };
    
    if (questions && questions.length > 0 && quizAnswers && quizAnswers.length > 0) {
      // Topic keywords to identify topics in questions
      const topicKeywords = [
        { keyword: "JavaScript", topic: "JavaScript" },
        { keyword: "React", topic: "React" },
        { keyword: "HTML", topic: "HTML" },
        { keyword: "CSS", topic: "CSS" },
        { keyword: "Node", topic: "Node.js" },
        { keyword: "Python", topic: "Python" },
        { keyword: "Java", topic: "Java" },
        { keyword: "SQL", topic: "SQL" },
        { keyword: "Database", topic: "Database" },
        { keyword: "API", topic: "API Development" },
        { keyword: "REST", topic: "REST APIs" },
        { keyword: "TypeScript", topic: "TypeScript" },
        { keyword: "MongoDB", topic: "MongoDB" },
        { keyword: "Express", topic: "Express.js" },
        { keyword: "Testing", topic: "Testing" },
        { keyword: "Debug", topic: "Debugging" },
        { keyword: "Algorithm", topic: "Algorithms" },
        { keyword: "Data Structure", topic: "Data Structures" },
        { keyword: "OOP", topic: "Object-Oriented Programming" },
        { keyword: "Functional", topic: "Functional Programming" },
        { keyword: "Git", topic: "Git" },
        { keyword: "Docker", topic: "Docker" },
        { keyword: "Cloud", topic: "Cloud Computing" },
        { keyword: "AWS", topic: "AWS" },
        { keyword: "Security", topic: "Security" },
        { keyword: "Performance", topic: "Performance" }
      ];
      
      // Track which topics have correct/incorrect answers
      const topicResults = {};
      
      questions.forEach((q, idx) => {
        const userAnswer = quizAnswers[idx];
        const correctAnswer = q.answer;
        const isCorrect = userAnswer && userAnswer.toUpperCase() === correctAnswer?.toUpperCase();
        
        const questionText = (q.question || "").toLowerCase();
        
        // Find topics in this question
        let foundTopics = [];
        for (const { keyword, topic } of topicKeywords) {
          if (questionText.includes(keyword.toLowerCase())) {
            foundTopics.push(topic);
          }
        }
        
        // If no specific topic found, use main topic
        if (foundTopics.length === 0 && topic) {
          foundTopics = [topic];
        }
        
        // If still no topic, use general category
        if (foundTopics.length === 0) {
          foundTopics = ["General Knowledge"];
        }
        
        // Record results for each topic found
        foundTopics.forEach(t => {
          if (!topicResults[t]) {
            topicResults[t] = { correct: 0, incorrect: 0 };
          }
          if (isCorrect) {
            topicResults[t].correct++;
          } else {
            topicResults[t].incorrect++;
          }
        });
      });
      
      // Categorize topics as strengths or areas to improve
      Object.entries(topicResults).forEach(([topic, results]) => {
        if (results.correct > results.incorrect) {
          topicPerformance.correct.push(topic);
        } else if (results.incorrect > 0) {
          topicPerformance.incorrect.push(topic);
        }
      });
    }
    
    return topicPerformance;
  };

  // Get AI explanation based on score differences
  const getAIExplanation = () => {
    const techScore = technicalScore || score || 0;
    const learnScore = learningScore || 50;
    const scoreDiff = learnScore - techScore;
    
    let explanation = "";
    
    if (scoreDiff > 20) {
      explanation = `Based on your assessment, your learning aptitude (${learnScore}%) significantly exceeds your current technical knowledge (${techScore}%). This indicates you have strong learning capabilities but may benefit from structured guidance to acquire technical skills. Your personalized learning plan focuses on building technical competency while leveraging your excellent learning ability.`;
    } else if (scoreDiff < -20) {
      explanation = `Your technical knowledge (${techScore}%) is notably higher than your learning aptitude score (${learnScore}%). This suggests you have practical skills but may benefit from understanding your optimal learning style. The recommended learning plan adapts to your current knowledge level while introducing metacognitive strategies to enhance learning efficiency.`;
    } else if (techScore >= 70 && learnScore >= 50) {
      explanation = `You demonstrate strong performance in both technical knowledge (${techScore}%) and learning aptitude (${learnScore}%). This balanced profile indicates you're well-positioned for advanced learning. Your personalized plan focuses on deepening expertise and exploring advanced topics that build on your solid foundation.`;
    } else if (techScore < 50 && learnScore < 50) {
      explanation = `Your assessment shows opportunities for growth in both technical knowledge (${techScore}%) and learning approach (${learnScore}%). The AI has designed a comprehensive learning plan that starts with fundamentals and gradually builds complexity, while also introducing effective learning strategies to maximize your progress.`;
    } else {
      explanation = `Your technical score (${techScore}%) and learning aptitude (${learnScore}%) are relatively balanced. The AI analysis has generated a personalized learning path that aligns with your current profile, focusing on practical skill-building while maintaining an appropriate challenge level.`;
    }
    
    return explanation;
  };

  // Get derived strengths (topics user performed well in)
  const getDerivedStrengths = () => {
    // First, analyze quiz results if available
    const quizAnalysis = analyzeQuizResults();
    if (quizAnalysis.correct.length > 0) {
      return quizAnalysis.correct;
    }
    
    // Fallback to existing strengths from analysis
    if (strengths && strengths.length > 0) {
      return strengths;
    }
    
    // For quiz mode, derive from score
    const techScore = technicalScore || score || 0;
    if (mode === "quiz" && techScore >= 60) {
      return ["Problem Solving", "Technical Knowledge", "Analytical Thinking"];
    }
    
    return [];
  };

  // Get derived areas to improve
  const getAreasToImprove = () => {
    // First, analyze quiz results if available
    const quizAnalysis = analyzeQuizResults();
    if (quizAnalysis.incorrect.length > 0) {
      return quizAnalysis.incorrect;
    }
    
    // Fallback to existing weakAreas from analysis
    if (weakAreas && weakAreas.length > 0) {
      return weakAreas;
    }
    
    // For quiz mode, derive from lower performance
    const techScore = technicalScore || score || 0;
    if (mode === "quiz" && techScore < 60) {
      return ["Technical Fundamentals", "Practical Application", "Conceptual Understanding"];
    }
    
    return [];
  };

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
        maxWidth: "900px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        padding: "40px"
      }}>
        <h2 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "10px", fontSize: "28px" }}>
           Personalized Performance Analysis
        </h2>

        {topic && (
          <p style={{ textAlign: "center", color: "#667eea", fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
             Topic: {topic}
          </p>
        )}

        {/* AI Analysis Explanation */}
        <div style={{
          background: "#4ea3f9",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "25px",
          color: "white",
          textAlign: "left"
        }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span></span> AI Analysis 
          </h4>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.95)", lineHeight: "1.7", fontSize: "15px" }}>
            {getAIExplanation()}
          </p>
        </div>

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
            <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 10px 0" }}>📊 Technical Knowledge</p>
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
            <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 10px 0" }}>🧠 Learning Preference</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: "0" }}>{learningScore || 50}%</p>
            <p style={{ fontSize: "14px", margin: "10px 0 0 0", opacity: 0.9 }}>Style: {getLearningStyle()}</p>
          </div>
        </div>

        {renderQuizScore()}


        {/* Simplified Summary - Quick Reference */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          {/* Strengths Summary */}
          <div style={{
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white"
          }}>
            <h5 style={{ margin: "0 0 10px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💪</span> Your Strengths
            </h5>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
              {getDerivedStrengths().length > 0 
                ? getDerivedStrengths().slice(0, 3).join(", ") 
                : "Keep learning to discover your strengths!"}
            </p>
          </div>

          {/* Areas to Improve Summary */}
          <div style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white"
          }}>
            <h5 style={{ margin: "0 0 10px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎯</span> Focus Areas
            </h5>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
              {getAreasToImprove().length > 0 
                ? getAreasToImprove().slice(0, 3).join(", ") 
                : "Great job! No specific areas to improve."}
            </p>
          </div>
        </div>

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
              {loading ? "Analyzing..." : " Personalized Learning Path"}
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
