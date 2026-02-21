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

  const getScoreColor = (score) => {
    if (!score) return "#6b7280";
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const calculateReadiness = (techScore, learnScore) => {
    const readiness = (techScore * 0.6) + (learnScore * 0.4);
    if (readiness >= 80) return { level: "Interview Ready", color: "#10b981", percentage: readiness };
    if (readiness >= 60) return { level: "Job Ready", color: "#f59e0b", percentage: readiness };
    if (readiness >= 40) return { level: "Developing", color: "#3b82f6", percentage: readiness };
    return { level: "Beginner", color: "#ef4444", percentage: readiness };
  };

  const weakAreasSummary = (() => {
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
  })();

  const chartData = (() => {
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
  })();

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

  // Calculate readiness
  const readiness = latestAssessment ? calculateReadiness(
    latestAssessment?.technicalScore || latestAssessment?.overallScore || 0,
    latestAssessment?.learningScore || 0
  ) : null;

  if (loading) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h2 style={{ color: 'var(--text-primary)' }}>Loading your learning progress...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Fetching your analysis history</p>
            <div className="loading-spinner" style={{ margin: '24px auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-3xl)' }}>📚 Learning Dashboard</h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>
              Track your growth and continue learning
            </p>
          </div>
          
          <button
            onClick={() => loadAnalyses()}
            disabled={loading}
            className="enterprise-btn"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="content-card" style={{ 
            background: 'var(--color-error-light)', 
            border: '1px solid var(--color-error)',
            marginBottom: '24px' 
          }}>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
            <button onClick={loadAnalyses} className="enterprise-btn" style={{ marginLeft: '16px' }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {analyses.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>No assessments yet</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              Complete your first analysis to start tracking your progress
            </p>
            <button onClick={() => navigate("/")} className="enterprise-btn">
              Get Started
            </button>
          </div>
        ) : (
          <div className="learning-dashboard-grid">
            {/* Left Column - Main Content */}
            <div>
              {/* Score Trend Chart */}
              {analyses.length > 0 && (
                <div className="content-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                    📈 Learning Progress (Last 3 Assessments)
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-md)'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="technicalScore" 
                          stroke="var(--color-primary)" 
                          strokeWidth={2}
                          name="Technical Score"
                          dot={{ fill: "var(--color-primary)", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="learningScore" 
                          stroke="var(--color-secondary)" 
                          strokeWidth={2}
                          name="Learning Score"
                          dot={{ fill: "var(--color-secondary)", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <p>No score data available for chart display</p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Summary Banner */}
              <div className="content-card" style={{
                marginBottom: '24px',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                borderRadius: 'var(--radius-xl)',
                color: 'white',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: 'var(--text-sm)' }}>Total Assessments</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'var(--font-bold)' }}>
                    {analyses.length}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: 'var(--text-sm)' }}>Progress Trend</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'var(--font-bold)' }}>
                    {trendIcon} {progressTrend.charAt(0).toUpperCase() + progressTrend.slice(1)}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: 'var(--text-sm)' }}>Latest Technical</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'var(--font-bold)' }}>
                    {latestAssessment?.technicalScore || latestAssessment?.overallScore || 0}%
                  </p>
                </div>
              </div>

              {/* Past Analyses List */}
              <div className="content-card">
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                  📋 Past Assessments
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyses.slice(0, 3).map((analysis, index) => {
                    const analysisKey = analysis.analysisId || analysis.id;
                    const analysisReadiness = calculateReadiness(
                      analysis.technicalScore || analysis.overallScore || 0,
                      analysis.learningScore || 0
                    );
                    const isSelected = selectedAnalysis?.id === analysisKey;

                    return (
                      <div
                        key={analysisKey || index}
                        onClick={() => loadAnalysisDetail(analysisKey)}
                        style={{
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--color-gray-50)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--space-4)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                              {analysis.topic || analysis.sourceType || "Assessment"}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                              {formatDate(analysis.createdAt)}
                            </p>
                          </div>
                          <span className={`badge badge-${analysisReadiness.level === 'Interview Ready' ? 'success' : analysisReadiness.level === 'Job Ready' ? 'warning' : 'neutral'}`}>
                            {analysisReadiness.level}
                          </span>
                        </div>
                        
                        {/* Analysis Detail View */}
                        {isSelected && selectedAnalysis && (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            {/* Technical & Learning Scores */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Technical</p>
                                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: getScoreColor(analysis.technicalScore || analysis.overallScore || 0), margin: 0 }}>
                                  {analysis.technicalScore || analysis.overallScore || 0}%
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Learning</p>
                                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: getScoreColor(analysis.learningScore || 0), margin: 0 }}>
                                  {analysis.learningScore || 0}%
                                </p>
                              </div>
                              {analysis.learningStyle && (
                                <div>
                                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Style</p>
                                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-secondary)', margin: 0 }}>
                                    {analysis.learningStyle}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Skills & Strengths */}
                            {(analysis.skills?.length > 0 || analysis.strengths?.length > 0) && (
                              <div style={{ marginBottom: '20px' }}>
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
                              className="enterprise-btn"
                              style={{
                                width: "100%",
                                marginTop: "20px",
                                background: "var(--color-primary)",
                              }}
                            >
                              🚀 Continue Learning
                            </button>
                          </div>
                        )}

                        {!isSelected && (
                          <>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Technical</p>
                                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: getScoreColor(analysis.technicalScore || analysis.overallScore || 0), margin: 0 }}>
                                  {analysis.technicalScore || analysis.overallScore || 0}%
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Learning</p>
                                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: getScoreColor(analysis.learningScore || 0), margin: 0 }}>
                                  {analysis.learningScore || 0}%
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                continueLearning(analysis);
                              }}
                              className="enterprise-btn"
                              style={{ marginTop: '12px', width: '100%' }}
                            >
                              Continue Learning →
                            </button>
                          </>
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
              {analyses.length > 0 && readiness && (
                <div className="content-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: "0 0 20px 0", color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
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
                        background: "var(--bg-card)",
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
                    background: "var(--color-gray-50)", 
                    borderRadius: "8px", 
                    padding: "15px",
                    fontSize: "13px",
                    color: "var(--text-secondary)"
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
              )}

              {/* Weak Areas Summary */}
              {weakAreasSummary.length > 0 && (
                <div className="content-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: "0 0 20px 0", color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                    🎯 Top Areas to Improve
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      className="enterprise-btn"
                      style={{
                        width: "100%",
                        marginTop: "15px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      🎯 Practice These Topics
                    </button>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="content-card">
                <h3 style={{ margin: "0 0 20px 0", color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                  📊 Quick Stats
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: "12px",
                    background: "var(--color-gray-50)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Source Type</span>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {latestAssessment?.sourceType === "resume" ? "Resume" : "GitHub"}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: "12px",
                    background: "var(--color-gray-50)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Latest Topic</span>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)", maxWidth: "150px", textAlign: "right" }}>
                      {latestAssessment?.topic || latestAssessment?.sourceType || "N/A"}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: "12px",
                    background: "var(--color-gray-50)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Joined</span>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {formatDate(analyses[analyses.length - 1]?.createdAt)}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: "12px",
                    background: latestAssessment ? "#ecfdf5" : "var(--color-gray-50)",
                    borderRadius: "8px",
                    border: latestAssessment ? "1px solid #10b981" : "none"
                  }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Last Active</span>
                    <span style={{ fontWeight: "600", color: latestAssessment ? "#059669" : "var(--text-primary)" }}>
                      {latestAssessment ? formatDate(latestAssessment.createdAt) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
          <button onClick={() => navigate("/")} className="enterprise-btn" style={{ background: "var(--color-gray-100)", color: "var(--text-primary)" }}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearningProgressPage;
