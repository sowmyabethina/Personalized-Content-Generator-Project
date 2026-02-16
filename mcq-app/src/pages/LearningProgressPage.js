import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function LearningProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userId from location state - pass null if not logged in to get all analyses
  const { userId: rawUserId } = location.state || {};
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadAnalyses();
    
    // Refresh data when page becomes visible (e.g., user returns from quiz)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAnalyses();
      }
    };
    
    // Also refresh on window focus
    const handleFocus = () => {
      loadAnalyses();
    };
    
    // Poll for updates every 5 seconds (more responsive for real-time)
    const intervalId = setInterval(() => {
      loadAnalyses();
    }, 5000);
    
    // Update current time every second for real-time display
    const timeIntervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      clearInterval(timeIntervalId);
    };
  }, [userId]);

  const loadAnalyses = async () => {
    setLoading(true);
    setError("");
    try {
      // Build URL - only include userId if it's not null
      let url = "http://localhost:5000/analyses";
      if (userId) {
        url += `?userId=${encodeURIComponent(userId)}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Explicitly sort by created_at DESC to ensure latest assessment is first
        const sortedAnalyses = (data.analyses || []).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setAnalyses(sortedAnalyses);
        setLastUpdated(new Date());
      } else {
        throw new Error("Failed to load analyses");
      }
    } catch (err) {
      console.error("Error loading analyses:", err);
      setError("Failed to load learning progress. Please try again.");
    }
    setLoading(false);
  };

  // Define latest and previous assessments for metric calculations
  const latestAssessment = analyses.length > 0 ? analyses[0] : null;
  const previousAssessment = analyses.length > 1 ? analyses[1] : null;

  const loadAnalysisDetail = async (analysisId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/analysis/${analysisId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAnalysis(data.analysis);
      } else {
        throw new Error("Failed to load analysis details");
      }
    } catch (err) {
      console.error("Error loading analysis:", err);
      setError("Failed to load analysis details.");
    }
    setLoading(false);
  };

  const continueLearning = (analysis) => {
    const analysisId = analysis.analysisId || analysis.id;
    localStorage.setItem("currentAnalysisId", analysisId);
    
    navigate("/result", {
      state: {
        topic: analysis.topic || analysis.sourceType || "Previous Analysis",
        technicalScore: analysis.technicalScore || analysis.overallScore || 0,
        learningScore: analysis.learningScore || 50,
        combinedAnalysis: {
          combinedAnalysis: `Previous assessment: ${analysis.technicalLevel || analysis.technicalScore + "%"} level, ${analysis.learningStyle || "Unknown"} learner`
        },
        mode: "saved",
        userId: analysis.userId,
        sourceType: analysis.sourceType,
        sourceUrl: analysis.sourceUrl,
        extractedText: analysis.extractedText,
        skills: analysis.skills || [],
        strengths: analysis.strengths || [],
        weakAreas: analysis.weakAreas || [],
        learningStyle: analysis.learningStyle,
        psychometricProfile: analysis.psychometricProfile
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Format time since last update for real-time display
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "Just now";
    const seconds = Math.floor((currentTime - lastUpdated) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return formatDate(lastUpdated);
  };

  const getLevelColor = (level) => {
    if (!level) return "#6b7280";
    const lower = level.toLowerCase();
    if (lower === "advanced") return "#10b981";
    if (lower === "intermediate") return "#f59e0b";
    return "#ef4444";
  };

  const getScoreColor = (score) => {
    if (!score) return "#6b7280";
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // Calculate placement readiness
  const calculateReadiness = (techScore, learnScore) => {
    const readiness = (techScore * 0.6) + (learnScore * 0.4);
    if (readiness >= 80) return { level: "Interview Ready", color: "#10b981", percentage: readiness };
    if (readiness >= 60) return { level: "Job Ready", color: "#f59e0b", percentage: readiness };
    if (readiness >= 40) return { level: "Developing", color: "#3b82f6", percentage: readiness };
    return { level: "Beginner", color: "#ef4444", percentage: readiness };
  };

  // Get weak areas frequency across all analyses
  const getWeakAreasSummary = () => {
    const weakAreasMap = {};
    analyses.forEach(analysis => {
      const weakAreas = analysis.weakAreas || [];
      weakAreas.forEach(area => {
        weakAreasMap[area] = (weakAreasMap[area] || 0) + 1;
      });
    });
    
    return Object.entries(weakAreasMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));
  };

  const weakAreasSummary = getWeakAreasSummary();

  // Prepare chart data - show only last 3 assessments for the graph
  const getChartData = () => {
    // Take only the last 3 analyses for the chart
    const recentAnalyses = analyses.slice(0, 3);
    return recentAnalyses
      .filter(a => a.technicalScore > 0 || a.learningScore > 0)
      .map(a => ({
        date: formatDate(a.createdAt),
        technicalScore: a.technicalScore || a.overallScore || 0,
        learningScore: a.learningScore || 0,
        fullDate: a.createdAt
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  };

  const chartData = getChartData();

  // Calculate progress trend comparing latest vs previous assessment
  const getProgressTrend = () => {
    if (!latestAssessment || !previousAssessment) return "neutral";
    
    const latestScore = latestAssessment.technicalScore || latestAssessment.overallScore || 0;
    const previousScore = previousAssessment.technicalScore || previousAssessment.overallScore || 0;
    
    if (latestScore > previousScore) return "improving";
    if (latestScore < previousScore) return "declining";
    return "neutral";
  };

  const progressTrend = getProgressTrend();
  const trendIcon = {
    improving: "📈",
    declining: "📉",
    stable: "➡️"
  }[progressTrend] || "➡️";

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
          <h2>Loading your learning progress...</h2>
          <p style={{ color: "#6b7280" }}>Fetching your analysis history</p>
          <div style={{ 
            marginTop: "20px", 
            width: "40px", 
            height: "40px", 
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "20px auto"
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto", 
        background: "#ffffff", 
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        padding: "30px"
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <h1 style={{ margin: 0, color: "#2c3e50", fontSize: "28px" }}>📚 Learning Dashboard</h1>
            <p style={{ margin: "5px 0 0 0", color: "#6b7280" }}>
              Track your growth and continue learning
            </p>
          </div>
          
          <button
            onClick={() => loadAnalyses()}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: loading ? "#e5e7eb" : "#3b82f6",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              color: loading ? "#9ca3af" : "#ffffff",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
            color: "#dc2626"
          }}>
            {error}
            <button 
              onClick={loadAnalyses}
              style={{
                marginLeft: "15px",
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "5px 15px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {analyses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
            <h2 style={{ color: "#2c3e50", marginBottom: "10px" }}>No assessments yet</h2>
            <p style={{ margin: "0 0 20px 0", fontSize: "16px" }}>
              Complete your first analysis to start tracking your progress
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500"
              }}
            >
              Get Started
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }}>
            
            {/* Left Column - Main Content */}
            <div>
              {/* Score Trend Chart - Show last 3 assessments */}
              {analyses.length > 0 && (
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "25px",
                  marginBottom: "25px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                  border: "1px solid #e5e7eb"
                }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50", fontSize: "18px" }}>
                    📈 Learning Progress (Last 3 Assessments)
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            background: "#fff", 
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="technicalScore" 
                          stroke="#667eea" 
                          strokeWidth={2}
                          name="Technical Score"
                          dot={{ fill: "#667eea", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="learningScore" 
                          stroke="#11998e" 
                          strokeWidth={2}
                          name="Learning Score"
                          dot={{ fill: "#11998e", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                      <p>No score data available for chart display</p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Summary Banner */}
              <div style={{
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                borderRadius: "12px",
                padding: "25px",
                color: "white",
                marginBottom: "25px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px"
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>Total Assessments</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold" }}>
                    {analyses.length}
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>Progress Trend</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold" }}>
                    {trendIcon} {progressTrend.charAt(0).toUpperCase() + progressTrend.slice(1)}
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>Latest Technical</p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold" }}>
                    {latestAssessment?.technicalScore || latestAssessment?.overallScore || 0}%
                  </p>
                </div>
              </div>

              {/* Past Analyses List */}
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb"
              }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50", fontSize: "18px" }}>
                  📋 Past Assessments
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Show only last 3 past assessments */}
                  {analyses.slice(0, 3).map((analysis, index) => {
                    const analysisKey = analysis.analysisId || analysis.id;
                    const readiness = calculateReadiness(
                      analysis.technicalScore || analysis.overallScore || 0,
                      analysis.learningScore || 0
                    );
                    const isSelected = selectedAnalysis?.id === analysisKey;

                    return (
                      <div
                        key={analysisKey || index}
                        onClick={() => loadAnalysisDetail(analysisKey)}
                        style={{
                          background: isSelected ? "#f0f9ff" : "#f8f9fa",
                          border: isSelected ? "2px solid #667eea" : "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "18px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "12px"
                        }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#2c3e50" }}>
                              {analysis.topic || analysis.sourceType || "Assessment"}
                            </p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                              {formatDate(analysis.createdAt)}
                            </p>
                          </div>
                          <span style={{
                            background: readiness.color,
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500"
                          }}>
                            {readiness.level}
                          </span>
                        </div>

                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(4, 1fr)", 
                          gap: "15px",
                          marginBottom: selectedAnalysis?.id === analysisKey ? "15px" : "0"
                        }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
                              Technical
                            </p>
                            <p style={{ margin: "3px 0 0 0", fontWeight: "600", color: getScoreColor(analysis.technicalScore || analysis.overallScore) }}>
                              {analysis.technicalLevel || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
                              Tech Score
                            </p>
                            <p style={{ margin: "3px 0 0 0", fontWeight: "600", color: getScoreColor(analysis.technicalScore || analysis.overallScore) }}>
                              {analysis.technicalScore || analysis.overallScore || 0}%
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
                              Learning
                            </p>
                            <p style={{ margin: "3px 0 0 0", fontWeight: "600", color: "#2c3e50" }}>
                              {analysis.learningStyle || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
                              Learn Score
                            </p>
                            <p style={{ margin: "3px 0 0 0", fontWeight: "600", color: getScoreColor(analysis.learningScore) }}>
                              {analysis.learningScore || 0}%
                            </p>
                          </div>
                        </div>

                        {/* Selected Analysis Detail */}
                        {isSelected && (
                          <div style={{
                            background: "#ffffff",
                            borderRadius: "8px",
                            padding: "20px",
                            marginTop: "15px",
                            border: "1px solid #e5e7eb"
                          }}>
                            {/* Topic & Scores */}
                            <div style={{ marginBottom: "20px" }}>
                              <h4 style={{ margin: "0 0 12px 0", color: "#2c3e50", fontSize: "15px" }}>
                                📊 Assessment Summary
                              </h4>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                                <div style={{ textAlign: "center", padding: "10px", background: "#f0f9ff", borderRadius: "8px" }}>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Technical</p>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold", color: "#667eea" }}>
                                    {analysis.technicalScore || analysis.overallScore || 0}%
                                  </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "10px", background: "#ecfdf5", borderRadius: "8px" }}>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Learning</p>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold", color: "#11998e" }}>
                                    {analysis.learningScore || 0}%
                                  </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "10px", background: "#fef3c7", borderRadius: "8px" }}>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Readiness</p>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold", color: readiness.color }}>
                                    {readiness.percentage.toFixed(0)}%
                                  </p>
                                </div>
                                <div style={{ textAlign: "center", padding: "10px", background: "#f3e8ff", borderRadius: "8px" }}>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Style</p>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: "bold", color: "#7c3aed" }}>
                                    {analysis.learningStyle || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Skills & Strengths */}
                            {(analysis.skills?.length > 0 || analysis.strengths?.length > 0) && (
                              <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "15px" }}>
                                  💪 Skills & Strengths
                                </h4>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {analysis.skills?.map((skill, i) => (
                                    <span key={i} style={{
                                      background: "#ecfdf5",
                                      color: "#059669",
                                      padding: "5px 12px",
                                      borderRadius: "20px",
                                      fontSize: "13px",
                                      fontWeight: "500"
                                    }}>
                                      {skill}
                                    </span>
                                  ))}
                                  {analysis.strengths?.map((strength, i) => (
                                    <span key={`s-${i}`} style={{
                                      background: "#d1fae5",
                                      color: "#047857",
                                      padding: "5px 12px",
                                      borderRadius: "20px",
                                      fontSize: "13px",
                                      fontWeight: "500",
                                      border: "1px solid #10b981"
                                    }}>
                                      ✓ {strength}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Weak Areas */}
                            {analysis.weakAreas?.length > 0 && (
                              <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "15px" }}>
                                  🎯 Areas to Improve
                                </h4>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {analysis.weakAreas.map((area, i) => (
                                    <span key={i} style={{
                                      background: "#fee2e2",
                                      color: "#dc2626",
                                      padding: "5px 12px",
                                      borderRadius: "20px",
                                      fontSize: "13px",
                                      fontWeight: "500"
                                    }}>
                                      {i === 0 && "🔴 "}{area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Learning Roadmap */}
                            {analysis.learningRoadmap && (
                              <div style={{ marginBottom: "20px" }}>
                                <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "15px" }}>
                                  🗺️ Learning Roadmap
                                </h4>
                                {Array.isArray(analysis.learningRoadmap) ? (
                                  <ol style={{ margin: 0, paddingLeft: "20px", color: "#555" }}>
                                    {analysis.learningRoadmap.slice(0, 5).map((step, i) => (
                                      <li key={i} style={{ marginBottom: "6px", fontSize: "14px" }}>{step}</li>
                                    ))}
                                  </ol>
                                ) : typeof analysis.learningRoadmap === 'object' ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {Object.entries(analysis.learningRoadmap).map(([phase, details], i) => (
                                      <div key={i} style={{
                                        background: "#f8f9fa",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        borderLeft: "3px solid #667eea"
                                      }}>
                                        <p style={{ margin: "0 0 5px 0", fontWeight: "600", color: "#2c3e50" }}>
                                          {phase}
                                        </p>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                                          {Array.isArray(details) ? details.join(", ") : details}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>
                                    {analysis.learningRoadmap}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* AI Recommendations */}
                            {(analysis.aiRecommendations || analysis.recommendations) && (
                              <div>
                                <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50", fontSize: "15px" }}>
                                  💡 AI Recommendations
                                </h4>
                                {Array.isArray(analysis.aiRecommendations || analysis.recommendations) ? (
                                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#555" }}>
                                    {(analysis.aiRecommendations || analysis.recommendations).slice(0, 5).map((rec, i) => (
                                      <li key={i} style={{ marginBottom: "6px", fontSize: "14px" }}>
                                        {typeof rec === 'object' ? rec.title || rec.type : rec}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>
                                    {analysis.aiRecommendations || analysis.recommendations}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Continue Learning Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                continueLearning(analysis);
                              }}
                              style={{
                                width: "100%",
                                marginTop: "20px",
                                padding: "14px",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "15px",
                                fontWeight: "600"
                              }}
                            >
                              🚀 Continue Learning
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div>
              {/* Placement Readiness */}
              {analyses.length > 0 && (() => {
                const readiness = calculateReadiness(
                  latestAssessment?.technicalScore || latestAssessment?.overallScore || 0,
                  latestAssessment?.learningScore || 0
                );
                return (
                  <div style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "25px",
                    marginBottom: "25px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50", fontSize: "18px" }}>
                      🎯 Placement Readiness
                    </h3>
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <div style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: `conic-gradient(${readiness.color} ${readiness.percentage * 3.6}deg, #e5e7eb 0deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto"
                      }}>
                        <div style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          background: "white",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <span style={{ fontSize: "24px", fontWeight: "bold", color: readiness.color }}>
                            {readiness.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p style={{ 
                        margin: "15px 0 0 0", 
                        fontSize: "20px", 
                        fontWeight: "600", 
                        color: readiness.color 
                      }}>
                        {readiness.level}
                      </p>
                    </div>
                    <div style={{ 
                      background: "#f8f9fa", 
                      borderRadius: "8px", 
                      padding: "15px",
                      fontSize: "13px",
                      color: "#555"
                    }}>
                      <p style={{ margin: "0 0 8px 0" }}>
                        <strong>Formula:</strong> (Technical × 0.6) + (Learning × 0.4)
                      </p>
                      <p style={{ margin: 0 }}>
                        Technical: {(latestAssessment?.technicalScore || latestAssessment?.overallScore || 0) * 0.6}% | 
                        Learning: {(latestAssessment?.learningScore || 0) * 0.4}%
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Weak Areas Frequency */}
              {weakAreasSummary.length > 0 && (
                <div style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "25px",
                  marginBottom: "25px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                  border: "1px solid #e5e7eb"
                }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50", fontSize: "18px" }}>
                    🎯 Top Areas to Improve
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {weakAreasSummary.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        style={{
                          background: "#fef3c7",
                          border: "1px solid #fcd34d",
                          borderRadius: "8px",
                          padding: "12px 15px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ 
                            background: "#f59e0b", 
                            color: "white", 
                            borderRadius: "50%", 
                            width: "24px", 
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ fontWeight: "500", color: "#92400e", fontSize: "14px" }}>
                            {item.area}
                          </span>
                        </div>
                        <span style={{ color: "#b45309", fontSize: "13px" }}>
                          {item.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                  {weakAreasSummary.length > 5 && (
                    <button
                      onClick={() => {
                        if (latestAssessment) continueLearning(latestAssessment);
                      }}
                      style={{
                        width: "100%",
                        marginTop: "15px",
                        padding: "12px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      🎯 Practice These Topics
                    </button>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "25px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb"
              }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50", fontSize: "18px" }}>
                  📊 Quick Stats
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "12px",
                    background: "#f8f9fa",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Source Type</span>
                    <span style={{ fontWeight: "600", color: "#2c3e50" }}>
                      {latestAssessment?.sourceType === "resume" ? "Resume" : "GitHub"}
                    </span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "12px",
                    background: "#f8f9fa",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Latest Topic</span>
                    <span style={{ fontWeight: "600", color: "#2c3e50", maxWidth: "150px", textAlign: "right" }}>
                      {latestAssessment?.topic || latestAssessment?.sourceType || "N/A"}
                    </span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "12px",
                    background: "#f8f9fa",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Joined</span>
                    <span style={{ fontWeight: "600", color: "#2c3e50" }}>
                      {formatDate(analyses[analyses.length - 1]?.createdAt)}
                    </span>
                  </div>
                  {/* Last Active - Show actual last active date from data */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "12px",
                    background: latestAssessment ? "#ecfdf5" : "#f8f9fa",
                    borderRadius: "8px",
                    border: latestAssessment ? "1px solid #10b981" : "none"
                  }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Last Active</span>
                    <span style={{ fontWeight: "600", color: latestAssessment ? "#059669" : "#2c3e50" }}>
                      {latestAssessment ? formatDate(latestAssessment.createdAt) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
          <button onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "500"

            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      
    </div>
  );
}

export default LearningProgressPage;
