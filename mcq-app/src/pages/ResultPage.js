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
    mode,
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


  const psychometricProfile = combinedAnalysis?.psychometricProfile || location.state?.psychometricProfile || null;

  const effectiveCombinedAnalysis = combinedAnalysis || location.state?.combinedData || null;


  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [learningMaterial, setLearningMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [learningTopic, setLearningTopic] = useState(topic || "");

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

  const generateContent = async () => {
    setLoading(true);
    setError("");

    try {
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

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const content = await res.json();

      setPersonalizedContent(content);
      setShowContent(true);

      saveAnalysisToDatabase(content, content.learningPath);
    } catch (err) {
      console.error("Content generation error:", err);
      setError("Failed to generate personalized content");
    }

    setLoading(false);
  };

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

      

      const roadmapData = {
        learningPath:
          material.sections?.map(s => `${s.title}: ${s.keyPoints?.join(", ")}`) ||
          [],
        tips: material.learningTips || [],
        finalProject: material.finalProject
      };
      saveAnalysisToDatabase(material, roadmapData);

      

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


  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="content-card">
          <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Your Learning Profile is Ready
          </h2>

          {topic && (
            <p style={{ textAlign: 'center', color: 'var(--color-primary)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)', marginBottom: '24px' }}>
              Topic: {topic}

            </p>
          )}

          {/* Score Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>Technical Knowledge</p>
              <p className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {technicalScore || score}%
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>Level: {getTechnicalLevel()}</p>
            </div>

            <div className="stat-card">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>Learning Preference</p>
              <p className="stat-value" style={{ color: 'var(--color-success)' }}>
                {learningScore || 50}%
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>Style: {getLearningStyle()}</p>
            </div>
          </div>


          {/* Psychometric Assessment Profile */}
          {psychometricProfile && (
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-5)',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Psychometric Assessment Profile</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* Technical Familiarity */}
                {psychometricProfile.levels?.technicalFamiliarity && (
                  <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Technical Familiarity</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {psychometricProfile.levels.technicalFamiliarity}

                    </p>
                  </div>
                )}


                {/* Documentation Skill */}
                {psychometricProfile.levels?.documentationSkill && (
                  <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Documentation Skill</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {psychometricProfile.levels.documentationSkill}
                    </p>
                  </div>
                )}

                {/* Learning Goal */}
                {psychometricProfile.levels?.learningGoal && (
                  <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Learning Goal</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {psychometricProfile.levels.learningGoal}
                    </p>
                  </div>
                )}

                {/* Application Confidence */}
                {psychometricProfile.levels?.applicationConfidence && (
                  <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Application Confidence</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {psychometricProfile.levels.applicationConfidence}
                    </p>
                  </div>
                )}

                {/* Learning Behavior */}
                {psychometricProfile.levels?.learningBehavior && (
                  <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Learning Behavior</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                      {psychometricProfile.levels.learningBehavior}
                    </p>
                  </div>
                )}
              </div>

              {/* Overall Level */}
              {psychometricProfile.overallLevel && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Overall Assessment Level</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                    {psychometricProfile.overallLevel}
                  </p>
                </div>
              )}

            </div>
          )}


          {!showContent ? (
            <>
              <button
                onClick={generateContent}
                disabled={loading}
                className="enterprise-btn success"
                style={{ marginBottom: '16px' }}
              >
                {loading ? "Generating..." : "Generate Personalized Learning Path"}
              </button>

              <button
                onClick={() => navigate("/quiz")}
                className="enterprise-btn secondary"
              >
                ↩ Back to Quiz
              </button>
            </>
          ) : (
            <div style={{
              background: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'left'
            }}>
              {personalizedContent && (
                <>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
                    {personalizedContent.title || "Your Personalized Learning Guide"}
                  </h3>

                  {personalizedContent.overview && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 'var(--leading-relaxed)', marginBottom: '24px' }}>
                      {personalizedContent.overview}
                    </p>
                  )}

                  {personalizedContent.learningPath && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Learning Path:</h4>
                      <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        {personalizedContent.learningPath.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '10px' }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {personalizedContent.resources && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📚 Resources:</h4>
                      {personalizedContent.resources.map((resource, idx) => (
                        <div key={idx} style={{
                          background: 'var(--color-white)',
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '12px',
                          borderLeft: '4px solid var(--color-primary)'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary)' }}>
                            {resource.type}: {resource.title}
                          </p>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            {resource.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {personalizedContent.tips && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>💡 Tips:</h4>
                      <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        {personalizedContent.tips.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personalizedContent.nextSteps && (
                    <div style={{
                      background: 'var(--color-success)',
                      padding: 'var(--space-5)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                        🚀 {personalizedContent.nextSteps}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={generateLearningMaterial}
                    disabled={loading}
                    className="enterprise-btn"
                    style={{ marginTop: '24px', marginBottom: '16px' }}
                  >
                    {loading ? "Generating..." : "📚 Generate Full Learning Material"}
                  </button>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                </div>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--color-error)', textAlign: 'center', marginTop: '20px', padding: '12px', background: 'var(--color-error-light)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default ResultPage;
