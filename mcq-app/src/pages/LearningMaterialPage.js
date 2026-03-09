import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ENDPOINTS from "../config/api";

// Local styles for Learning Progress Dashboard
/* UI_REFRESH_V2_MUTED_THEME */
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
    background: #f8fafc; /* Soft neutral background */
  }
  
  .summary-row {
    width: 100%;
    margin-bottom: 32px;
  }
  
  .main-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    width: 100%;
    align-items: start;
  }
  
  .lp-content-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    height: fit-content;
  }

  /* PLEASANT ROADMAP CARDS */
  .roadmap-card-urgent {
    background: #fffcfc;
    border: 1px solid #fee2e2;
    border-left: 5px solid #f87171; /* Softer Red */
  }
  
  .roadmap-card-success {
    background: #fafffc;
    border: 1px solid #d1fae5;
    border-left: 5px solid #34d399; /* Soft Green */
  }

  .lp-enterprise-btn {
    padding: 12px 20px;
    background: #4f46e5;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }

  .btn-outline-red {
    background: #fff5f5;
    color: #e53e3e;
    border: 1px solid #feb2b2;
  }

  .btn-outline-red:hover {
    background: #fff0f0;
  }

  @media (max-width: 1024px) {
    .main-grid { grid-template-columns: 1fr; }
  }
`;

function LearningProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we have learning material data passed via navigation state
  const { learningMaterial, topic, technicalLevel, learningStyle, analysisId } = location.state || {};
  
  // If we have learning material data, we're in "display material" mode
  const isDisplayingMaterial = !!learningMaterial;
  
  const { userId: rawUserId } = location.state || {};
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllAssessments, setShowAllAssessments] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadAnalyses(); }, [userId]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      let url = ENDPOINTS.ANALYSIS.GET_ALL;
      if (userId) url += `?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalyses((data.analyses || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) { setError("Failed to load data."); }
    setLoading(false);
  };

  const continueLearning = (a) => navigate("/result", { state: { ...a, mode: "saved" } });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const latestAssessment = analyses[0] || null;
  const readiness = latestAssessment ? ((latestAssessment.technicalScore || 0) * 0.6 + (latestAssessment.learningScore || 0) * 0.4) : 0;

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

  // If we have learning material data, display it instead of the progress dashboard
  if (isDisplayingMaterial) {
    return (
      <div className="lp-page-container">
        <style>{dashboardStyles}</style>
        <div className="lp-content-wrapper">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: '#1e293b' }}>📚 Learning Material</h1>
            {topic && <p style={{ color: '#64748b', marginTop: '8px' }}>Topic: {topic}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
              {technicalLevel && (
                <span style={{ padding: '6px 16px', background: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Level: {technicalLevel}
                </span>
              )}
              {learningStyle && (
                <span style={{ padding: '6px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Style: {learningStyle}
                </span>
              )}
            </div>
          </div>

          {/* Learning Material Content */}
          <div className="lp-content-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
            {learningMaterial.title && (
              <h2 style={{ color: '#1e293b', marginBottom: '24px' }}>{learningMaterial.title}</h2>
            )}
            
            {learningMaterial.summary && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: '#4f46e5', marginBottom: '12px' }}>Overview</h3>
                <p style={{ color: '#475569', lineHeight: '1.7' }}>{learningMaterial.summary}</p>
              </div>
            )}

            {/* Sections */}
            {learningMaterial.sections && Array.isArray(learningMaterial.sections) && (
              <div style={{ marginBottom: '32px' }}>
                {learningMaterial.sections.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: '32px', padding: '24px', background: '#f8fafc', borderRadius: '16px' }}>
                    <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>{section.title}</h3>
                    {section.content && (
                      <p style={{ color: '#475569', lineHeight: '1.7', marginBottom: '16px' }}>
                        {section.content}
                      </p>
                    )}
                    {section.keyPoints && Array.isArray(section.keyPoints) && section.keyPoints.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#4f46e5', marginBottom: '8px', fontSize: '14px' }}>Key Points:</h4>
                        <ul style={{ color: '#475569', paddingLeft: '20px' }}>
                          {section.keyPoints.map((point, pidx) => (
                            <li key={pidx} style={{ marginBottom: '4px' }}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.examples && Array.isArray(section.examples) && section.examples.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#4f46e5', marginBottom: '8px', fontSize: '14px' }}>Examples:</h4>
                        {section.examples.map((example, eidx) => (
                          <div key={eidx} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
                            {example.title && <strong style={{ color: '#1e293b' }}>{example.title}</strong>}
                            {example.description && <p style={{ color: '#475569', margin: '8px 0' }}>{example.description}</p>}
                            {example.code && (
                              <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '8px', overflow: 'auto', fontSize: '13px' }}>
                                {example.code}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Learning Tips */}
            {learningMaterial.learningTips && Array.isArray(learningMaterial.learningTips) && learningMaterial.learningTips.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: '#4f46e5', marginBottom: '16px' }}>💡 Learning Tips</h3>
                <ul style={{ color: '#475569', paddingLeft: '20px' }}>
                  {learningMaterial.learningTips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Final Project */}
            {learningMaterial.finalProject && (
              <div style={{ marginBottom: '32px', padding: '24px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ color: '#166534', marginBottom: '12px' }}>🚀 Final Project</h3>
                {learningMaterial.finalProject.title && <h4 style={{ color: '#15803d' }}>{learningMaterial.finalProject.title}</h4>}
                {learningMaterial.finalProject.description && <p style={{ color: '#166534', marginBottom: '12px' }}>{learningMaterial.finalProject.description}</p>}
                {learningMaterial.finalProject.steps && Array.isArray(learningMaterial.finalProject.steps) && (
                  <ol style={{ color: '#166534', paddingLeft: '20px' }}>
                    {learningMaterial.finalProject.steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Cheatsheet */}
            {learningMaterial.cheatsheet && (
              <div style={{ marginBottom: '32px', padding: '24px', background: '#fffbeb', borderRadius: '16px', border: '1px solid #fde68a' }}>
                <h3 style={{ color: '#92400e', marginBottom: '16px' }}>📋 Quick Reference</h3>
                {learningMaterial.cheatsheet.commands && Array.isArray(learningMaterial.cheatsheet.commands) && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#b45309', marginBottom: '8px', fontSize: '14px' }}>Commands:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {learningMaterial.cheatsheet.commands.map((cmd, idx) => (
                        <span key={idx} style={{ background: 'white', padding: '6px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px' }}>
                          {cmd}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {learningMaterial.cheatsheet.definitions && typeof learningMaterial.cheatsheet.definitions === 'object' && (
                  <div>
                    <h4 style={{ color: '#b45309', marginBottom: '8px', fontSize: '14px' }}>Definitions:</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {Object.entries(learningMaterial.cheatsheet.definitions).map(([term, def], idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                          <strong style={{ color: '#92400e', minWidth: '120px' }}>{term}:</strong>
                          <span style={{ color: '#78350f' }}>{def}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                onClick={() => navigate("/result", { state: { topic, technicalScore: parseInt(localStorage.getItem("technicalScore") || "0") } })} 
                className="lp-enterprise-btn"
              >
                ← Back to Results
              </button>
              <button 
                onClick={() => navigate("/quiz", { 
                  state: { 
                    topic: topic || 'Learning Material Quiz', 
                    fromMaterial: true,
                    materialTopic: topic || 'Learning Material Quiz',
                    extractedText: learningMaterial?.sections?.map(s => s.content).join('\n\n') || learningMaterial?.summary || learningMaterial?.title || ''
                  } 
                })} 
                className="lp-enterprise-btn"
                style={{ background: '#059669' }}
              >
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the Learning Progress Dashboard (original behavior)
  return (
    <div className="lp-page-container">
      <style>{dashboardStyles}</style>
      <div className="lp-content-wrapper">

        {/* Tab Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#1e293b' }}>📚 Learning Workspace</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content', margin: '20px auto' }}>
            <button onClick={() => setActiveTab('overview')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'overview' ? 'white' : 'transparent', color: activeTab === 'overview' ? '#4f46e5' : '#64748b', fontWeight: '600', boxShadow: activeTab === 'overview' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}>Overview</button>
            <button onClick={() => setActiveTab('roadmap')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'roadmap' ? 'white' : 'transparent', color: activeTab === 'roadmap' ? '#4f46e5' : '#64748b', fontWeight: '600', boxShadow: activeTab === 'roadmap' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none' }}>Roadmap</button>
          </div>
        </div>

        {/* 📊 OVERVIEW TAB (Kept EXACTLY same structure) */}
        {activeTab === 'overview' && (
          <>
            <div className="summary-row">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[{l:'Assessments', v:analyses.length, bg:'#eff6ff', c:'#1e40af'}, {l:'Trend', v:'Stable', bg:'#ecfdf5', c:'#065f46'}, {l:'Latest Result', v:`${latestAssessment?.technicalScore || 0}%`, bg:'#fffbeb', c:'#92400e'}, {l:'Learning Type', v:latestAssessment?.learningStyle || 'N/A', bg:'#f5f3ff', c:'#5b21b6'}].map((s,i) => (
                   <div key={i} className="lp-content-card" style={{ background: s.bg, border: 'none', textAlign: 'center' }}>
                     <p style={{ margin: 0, fontSize: '13px', color: s.c, opacity: 0.7 }}>{s.l}</p>
                     <h2 style={{ margin: '8px 0 0 0', color: s.c, fontSize: i===3?'17px':'28px' }}>{s.v}</h2>
                   </div>
                ))}
              </div>
            </div>

            <div className="main-grid">
              <div className="column-flex">
                <div className="lp-content-card">
                  <h3>📈 Progress Trend</h3>
                  <div style={{height: 250, marginTop: 24}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyses.slice(0,5).reverse().map(a=>({d:formatDate(a.createdAt), s:a.technicalScore}))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="d" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="s" stroke="#4f46e5" strokeWidth={4} dot={{ r: 5, fill: '#4f46e5' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lp-content-card">
                  <h3>📋 History</h3>
                  <div style={{ marginTop: 16 }}>
                    {analyses.slice(0, showAllAssessments ? analyses.length : 1).map((a, i) => (
                      <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700' }}>{a.topic}</span>
                          <span style={{ color: '#4f46e5', fontWeight: '800' }}>{a.technicalScore}%</span>
                        </div>
                        <button onClick={() => continueLearning(a)} className="lp-enterprise-btn" style={{ marginTop: 12, padding: '8px' }}>View Detail</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="column-flex">
                <div className="lp-content-card" style={{ textAlign: 'center' }}>
                  <h3>🎯 Career Readiness</h3>
                  <div style={{ fontSize: '64px', fontWeight: '900', color: '#1e293b', margin: '16px 0' }}>{readiness.toFixed(0)}%</div>
                  <div style={{ padding: '6px 16px', background: '#dcfce7', color: '#166534', borderRadius: '20px', display: 'inline-block', fontSize: '13px', fontWeight: '700' }}>JOB READY</div>
                </div>
                <div className="lp-content-card">
                  <h3>📊 Quick Stats</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Source</span><strong>{latestAssessment?.sourceType}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Joined</span><strong>{formatDate(analyses[analyses.length-1]?.createdAt)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f0fdf4', borderRadius: '12px' }}><span style={{ color: '#166534' }}>Last Active</span><strong style={{ color: '#166534' }}>{formatDate(latestAssessment?.createdAt)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🗺️ ROADMAP TAB (CLEANER, NON-DOMINATING COLORS) */}
        {activeTab === 'roadmap' && analyses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
             
             {/* 🚨 Red: Focus Areas (Muted Borders) */}
             {analyses.filter(a => (a.technicalScore || 0) < 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>🚨 Foundational Skills to Master</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {analyses.filter(a => (a.technicalScore || 0) < 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-urgent">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#991b1b' }}>{a.topic}</h4>
                              <span style={{ color: '#dc2626', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#7f1d1d', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Master basics of {a.topic} through the course below.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={`https://www.youtube.com/results?search_query=${a.topic}+full+course`} target="_blank" className="lp-enterprise-btn" style={{ flex: 2 }}>📺 Course</a>
                              <button onClick={() => continueLearning(a)} className="lp-enterprise-btn btn-outline-red" style={{ flex: 1 }}>🔄 Retake</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* ✅ Green: Mastered Areas (Soft Borders) */}
             {analyses.filter(a => (a.technicalScore || 0) >= 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#059669', marginBottom: '16px' }}>🏆 Proficiency Achieved</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {analyses.filter(a => (a.technicalScore || 0) >= 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-success">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#064e3b' }}>{a.topic}</h4>
                              <span style={{ color: '#059669', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#064e3b', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Excellent grasp! Challenge yourself with advanced projects.</p>
                           <button onClick={() => navigate("/pdf-chat")} className="lp-enterprise-btn" style={{ background: '#059669' }}>🔥 Advanced Practice</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningProgressPage;
