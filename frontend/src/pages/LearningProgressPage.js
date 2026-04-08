import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import useAnalyses from "../hooks/useAnalyses";
import { formatAnalysisDate } from "../utils/analysis/analysisHelpers";
import { processProgress } from "../services/progress/progressService";
import { formatCourseName } from "../utils/analysis/progressDashboard";

// Local styles for Learning Progress Dashboard
/* UI_REFRESH_V2 */
const dashboardStyles = `
  .lp-content-wrapper {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: block;
    padding: 40px 24px 60px;
  }
  
  .lp-page-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f4f7fc 0%, #eef2ff 100%);
  }
  
  .summary-row {
    width: 100%;
    margin-bottom: 32px;
  }
  
  .main-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Force 2 equal columns */
    gap: 24px;
    width: 100%;
    align-items: start;
  }
  
  .main-grid > div {
    width: 100%;
    min-width: 0;
  }
  
  .column-flex {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .lp-content-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.05);
    height: fit-content;
  }
  
  /* Soft Card Classes for Roadmap */
  .soft-card-red {
    background: #fff5f5;
    border: 1px solid #e2e8f0;
    border-top: 5px solid #ef4444;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  
  .soft-card-yellow {
    background: #fffbeb;
    border: 1px solid #e2e8f0;
    border-top: 5px solid #f59e0b;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  
  .soft-card-green {
    background: #f0fdf4;
    border: 1px solid #e2e8f0;
    border-top: 5px solid #22c55e;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  
  .lp-enterprise-btn {
    padding: 14px 24px;
    background: linear-gradient(135deg, var(--color-primary), #4F46E5);
    border: none;
    border-radius: 12px;
    color: var(--text-inverse);
    font-size: var(--text-base);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    width: 100%;
    position: relative;
    overflow: hidden;
    text-align: center;
    text-decoration: none;
    display: inline-block;
  }
  
  .lp-enterprise-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(99,102,241,0.3);
  }
  
  .lp-enterprise-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 1024px) {
    .main-grid { grid-template-columns: 1fr; }
  }
  
  @media (max-width: 900px) {
    .dashboard-layout {
      grid-template-columns: 1fr;
    }
    .dashboard-full,
    .dashboard-left,
    .dashboard-right {
      grid-column: 1 / 2;
    }
  }
`;

function LearningProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { userId: rawUserId } = location.state || {};
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

  const { analyses, loading, error, loadAnalyses } = useAnalyses(userId);
  const [showAllAssessments, setShowAllAssessments] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [processedProgress, setProcessedProgress] = useState({
    uniqueCourses: [],
    categories: { needsAttention: [], improving: [], strong: [] },
    chartData: [],
    readiness: null,
  });

  useEffect(() => {
    loadAnalyses();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAnalyses();
      }
    };
    
    const handleFocus = () => {
      loadAnalyses();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, loadAnalyses]);

  const latestAssessment = analyses.length > 0 ? analyses[0] : null;
  const previousAssessment = analyses.length > 1 ? analyses[1] : null;

  useEffect(() => {
    const loadProgressInsights = async () => {
      const processed = await processProgress(analyses);
      setProcessedProgress({
        uniqueCourses: processed.uniqueCourses || [],
        categories: processed.categories || { needsAttention: [], improving: [], strong: [] },
        chartData: processed.chartData || [],
        readiness: processed.readiness || null,
      });
    };

    loadProgressInsights();
  }, [analyses]);

  const startLearning = (analysis) => {
    const analysisId = analysis.analysisId || analysis.id;
    localStorage.setItem("currentAnalysisId", analysisId);
    
    navigate("/learning-material", {
      state: { reset: true }
    });
  };

  const uniqueCourses = processedProgress.uniqueCourses;
  const { needsAttention, improving, strong } = processedProgress.categories;
  const chartData = processedProgress.chartData;

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

  const readiness = processedProgress.readiness;

  if (loading) {
    return (
      <div className="page-container lp-page-container">
        <style>{dashboardStyles}</style>
        <div className="lp-content-wrapper">
          <div className="lp-content-card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h2 style={{ color: 'var(--text-primary)' }}>Loading your learning progress...</h2>
            <div className="loading-spinner" style={{ margin: '24px auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container lp-page-container">
      <style>{dashboardStyles}</style>
      <div className="lp-content-wrapper">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-3xl)' }}>📚 Learning Dashboard</h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>Track your growth and continue learning</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ padding: '10px 22px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: activeTab === 'overview' ? '600' : '400', backgroundColor: activeTab === 'overview' ? '#4f46e5' : '#f3f4f6', color: activeTab === 'overview' ? '#fff' : '#374151', transition: 'all 0.2s ease' }}>📊 Overview</button>
          <button onClick={() => setActiveTab('roadmap')} style={{ padding: '10px 22px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: activeTab === 'roadmap' ? '600' : '400', backgroundColor: activeTab === 'roadmap' ? '#4f46e5' : '#f3f4f6', color: activeTab === 'roadmap' ? '#fff' : '#374151', transition: 'all 0.2s ease' }}>🗺️ Roadmap</button>
        </div>

        {error && (
          <div className="content-card" style={{ background: 'var(--color-error-light)', border: '1px solid var(--color-error)', marginBottom: '24px' }}>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
            <button onClick={loadAnalyses} className="lp-enterprise-btn" style={{ marginLeft: '16px' }}>Retry</button>
          </div>
        )}

        {/* OVERVIEW TAB CONTENT */}
        {activeTab === 'overview' && (
          <>
            {analyses.length === 0 ? (
              <div className="lp-content-card" style={{ textAlign: 'center', padding: '48px', background: 'white' }}>
                <h2>No assessments yet</h2>
                <button onClick={() => navigate("/")} className="lp-enterprise-btn">Get Started</button>
              </div>
            ) : (
              <>
                <div className="summary-row" style={{ width: '100%', padding: '24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', marginBottom: '32px', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '24px', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', borderRadius: '12px', border: '1px solid #7dd3fc', minHeight: '120px' }}>
                        <div style={{ fontSize: '36px', flexShrink: 0, marginRight: '16px' }}>📊</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, color: '#0369a1', fontSize: '14px', fontWeight: '500' }}>Total Tests</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '36px', fontWeight: '800', color: '#0369a1', whiteSpace: 'nowrap', lineHeight: 1.1 }}>{analyses.length}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', border: '1px solid #bbf7d0', minHeight: '120px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📈</div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Progress Trend</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#15803d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trendIcon} {progressTrend.charAt(0).toUpperCase() + progressTrend.slice(1)}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px', border: '1px solid #fcd34d', minHeight: '120px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Latest Technical</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#b45309', whiteSpace: 'nowrap' }}>{latestAssessment?.technicalScore || latestAssessment?.overallScore || 0}%</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', borderRadius: '12px', border: '1px solid #d8b4fe', minHeight: '120px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Status</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#7e22ce', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{latestAssessment?.learningStyle || 'In Progress'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="main-grid" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                  <div className="dashboard-left main-content-gap">
                    <div className="lp-content-card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>📈 Learning Progress (Last 3 Assessments)</h3>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="technicalScore" stroke="var(--color-primary)" strokeWidth={2} name="Technical Score" dot={{ fill: "var(--color-primary)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="learningScore" stroke="var(--color-secondary)" strokeWidth={2} name="Learning Score" dot={{ fill: "var(--color-secondary)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}><p>No score data available for chart display</p></div>
                      )}
                    </div>

                    <div className="lp-content-card">
                      <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>📋 Past Assessments</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analyses.slice(0, showAllAssessments ? analyses.length : 1).map((a, i) => (
                          <div key={i} style={{ padding: '16px', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{a.topic || "Assessment"}</strong>
                              <span>{a.technicalScore}%</span>
                            </div>
                            <button onClick={() => startLearning(a)} className="lp-enterprise-btn" style={{ marginTop: '12px' }}>Continue Learning →</button>
                          </div>
                        ))}
                      </div>
                      {!showAllAssessments && analyses.length > 1 && (<button onClick={() => setShowAllAssessments(true)} className="lp-enterprise-btn" style={{ marginTop: '16px' }}>Show More</button>)}
                    </div>
                  </div>

                  <div className="dashboard-right main-content-gap">
                    <div className="lp-content-card" style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: "0 0 20px 0", color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>🎯 Placement Readiness</h3>
                      <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: `conic-gradient(${readiness?.color} ${readiness?.percentage * 3.6}deg, #e5e7eb 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                          <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "24px", fontWeight: "bold", color: readiness?.color }}>{readiness?.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        <p style={{ margin: "15px 0 0 0", fontSize: "20px", fontWeight: "600", color: readiness?.color }}>{readiness?.level}</p>
                      </div>
                    </div>

                    <div className="lp-content-card">
                      <h3 style={{ margin: "0 0 20px 0", color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>📊 Quick Stats</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: "16px", background: "var(--color-gray-50)", borderRadius: "12px" }}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: '500' }}>Source Type</span>
                          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{latestAssessment?.sourceType === "resume" ? "Resume" : "GitHub"}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: "16px", background: "var(--color-gray-50)", borderRadius: "12px" }}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: '500' }}>Joined Date</span>
                          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{formatAnalysisDate(analyses[analyses.length - 1]?.createdAt)}</span>
                        </div>
                        {/* ✅ RESTORED: Last Active Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: "16px", background: latestAssessment ? "#ecfdf5" : "var(--color-gray-50)", borderRadius: "12px", border: latestAssessment ? "1px solid #059669" : "none" }}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: '500' }}>Last Active</span>
                          <span style={{ fontWeight: "600", color: latestAssessment ? "#059669" : "var(--text-primary)" }}>{latestAssessment ? formatAnalysisDate(latestAssessment.createdAt) : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 🗺️ ROADMAP TAB (USER FRIENDLY RESTORATION) */}
        {activeTab === 'roadmap' && uniqueCourses.length > 0 && (
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
             {/* 🔴 High Priority */}
             {needsAttention.length > 0 && (
                <div>
                   <h3 style={{ color: '#64748b', marginBottom: '16px', fontWeight: '600' }}>⚠️ Needs Attention</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                      {needsAttention.map((a, idx) => (
                        <div key={idx} className="soft-card-red">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>{a.score}%</span>
                           </div>
                           <h4 style={{ margin: '0 0 8px 0', fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>{formatCourseName(a.name)}</h4>
                           <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Focus on basics. Complete these curated courses to build your expertise.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={`https://www.youtube.com/results?search_query=${a.topic || a.name}+full+course`} target="_blank" rel="noreferrer" className="lp-enterprise-btn" style={{ background: '#3b82f6', flex: 1, textDecoration: 'none', fontSize: '14px', padding: '12px 16px' }}>📺 Watch Course</a>
                              <button onClick={() => startLearning(a)} className="lp-enterprise-btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', flex: 1, fontSize: '14px', padding: '12px 16px' }}>🔄 Retake</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* 🟡 Improving Areas */}
             {improving.length > 0 && (
                <div>
                   <h3 style={{ color: '#64748b', marginBottom: '16px', fontWeight: '600' }}>📈 Improving Areas</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                      {improving.map((a, idx) => (
                        <div key={idx} className="soft-card-yellow">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>{a.score}%</span>
                           </div>
                           <h4 style={{ margin: '0 0 8px 0', fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>{formatCourseName(a.name)}</h4>
                           <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Making progress! Deepen your knowledge with advanced implementation scenarios.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={`https://www.youtube.com/results?search_query=${a.topic || a.name}+tutorial+advanced`} target="_blank" rel="noreferrer" className="lp-enterprise-btn" style={{ background: '#3b82f6', flex: 1, textDecoration: 'none', fontSize: '14px', padding: '12px 16px' }}>📺 Watch Course</a>
                              <button onClick={() => startLearning(a)} className="lp-enterprise-btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', flex: 1, fontSize: '14px', padding: '12px 16px' }}>🔄 Retake</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* 🟢 Strong Areas */}
             {strong.length > 0 && (
                <div>
                   <h3 style={{ color: '#64748b', marginBottom: '16px', fontWeight: '600' }}>🏆 Strong Areas</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                      {strong.map((a, idx) => (
                        <div key={idx} className="soft-card-green">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>{a.score}%</span>
                           </div>
                           <h4 style={{ margin: '0 0 8px 0', fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>{formatCourseName(a.name)}</h4>
                           <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Excellent work! Stay sharp by practicing complex real-world problems.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={`https://www.youtube.com/results?search_query=${a.topic || a.name}+practice+problems`} target="_blank" rel="noreferrer" className="lp-enterprise-btn" style={{ background: '#3b82f6', flex: 1, textDecoration: 'none', fontSize: '14px', padding: '12px 16px' }}>📺 Practice</a>
                              <button onClick={() => startLearning(a)} className="lp-enterprise-btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', flex: 1, fontSize: '14px', padding: '12px 16px' }}>🔄 Review</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'roadmap' && uniqueCourses.length === 0 && (
          <div style={{ background: '#f8fafc', minHeight: '100%', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>No Roadmap Yet</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>Complete assessments to get your personalized learning roadmap.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningProgressPage;
