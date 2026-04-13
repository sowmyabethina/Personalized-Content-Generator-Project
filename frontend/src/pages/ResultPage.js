import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { processResult, saveAnalysis, updateAnalysis } from "../services/analysis/analysisService";
import {
  generateLearningMaterial as requestLearningMaterial,
  generatePersonalizedContent,
} from "../services/learning/learningMaterialService";
import { getLearningStyle, getTechnicalLevel } from "../utils/quiz/psychometric";

// Debug log to verify component is loaded
console.log("ACTIVE RESULTS COMPONENT LOADED");

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    score,
    topic,
    technicalScore,
    learningScore,
    combinedAnalysis,
    userId,
    sourceType,
    sourceUrl,
    extractedText,
    skills,
    strengths,
    weakAreas
  } = location.state || {
    score: 0,
    topic: "",
    technicalScore: 0,
    learningScore: 0,
    combinedAnalysis: null,
    userId: null,
    sourceType: "resume",
    sourceUrl: null,
    extractedText: null,
    skills: [],
    strengths: [],
    weakAreas: []
  };
  const psychometricProfile = combinedAnalysis?.psychometricProfile || location.state?.psychometricProfile || null;

  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [learningTopic] = useState(topic || "");
  const effectiveTechnicalLevel = getTechnicalLevel(technicalScore || score || 0);
  const effectiveLearningStyle = getLearningStyle(learningScore || 50);

  const saveAnalysisToDatabase = async (contentData, roadmapData) => {
    try {
      const existingAnalysisId = localStorage.getItem("currentAnalysisId");
      const processedResult = await processResult({
        resultData: {
          score,
          topic: learningTopic || topic || null,
          technicalScore: technicalScore || score || 0,
          learningScore: learningScore || null,
          technicalLevel: effectiveTechnicalLevel,
          learningStyle: effectiveLearningStyle,
          psychometricProfile: combinedAnalysis?.psychometricProfile || null,
        },
        userContext: {
          userId,
          sourceType,
          sourceUrl,
          extractedText,
          skills,
          strengths,
          weakAreas,
        },
        contentData,
        roadmapData,
      });
      const analysisData = processedResult.analysisData;

      if (existingAnalysisId) {
        await updateAnalysis(existingAnalysisId, analysisData);
        setAnalysisId(existingAnalysisId);
        console.log("✅ Analysis updated:", existingAnalysisId);
      } else {
        const saveData = await saveAnalysis(analysisData);
        setAnalysisId(saveData.analysisId);
        localStorage.setItem("currentAnalysisId", saveData.analysisId);
        console.log("✅ Analysis saved with ID:", saveData.analysisId);
      }
    } catch (saveErr) {
      console.error("Failed to save analysis:", saveErr);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await generatePersonalizedContent(
        learningTopic || topic || "General Technology",
        userId,
        {
          technicalLevel: effectiveTechnicalLevel,
          learningStyle: effectiveLearningStyle,
          technicalScore: technicalScore || score,
          learningScore: learningScore || 50,
        }
      );
      console.log("API RESPONSE:", data);

      if (!data || typeof data !== "object") {
        setError("Unexpected response from the server.");
        return;
      }

      if (data.success === false || data.error) {
        setError(
          typeof data.details === "string"
            ? data.details
            : data.error || data.message || "Failed to generate personalized content."
        );
        return;
      }

      // Direct /learning/generate-combined-content payload (optionally nested from older agent clients)
      const raw =
        data.data && typeof data.data === "object"
          ? data.data
          : data;

      let parsedContent =
        typeof raw === "string"
          ? (() => {
              try {
                return JSON.parse(raw);
              } catch {
                return {};
              }
            })()
          : { ...raw };

      const path =
        (Array.isArray(parsedContent.learningPath) && parsedContent.learningPath) ||
        (Array.isArray(parsedContent.learning_path) && parsedContent.learning_path) ||
        (Array.isArray(parsedContent.suggestedPath) && parsedContent.suggestedPath) ||
        [];

      const { success: _omitSuccess, ...rest } = parsedContent;
      parsedContent = { ...rest, learningPath: path };

      setPersonalizedContent(parsedContent);
      setShowContent(true);

      saveAnalysisToDatabase(parsedContent, parsedContent.learningPath);
    } catch (err) {
      console.error("Content generation error:", err);
      setError(err.message || "Failed to generate personalized content");
    }

    setLoading(false);
  };

  const handleGenerateLearningMaterial = async () => {
    setLoading(true);
    setError("");

    try {
      const material = await requestLearningMaterial(
        learningTopic || topic || "General Technology",
        effectiveTechnicalLevel,
        effectiveLearningStyle
      );
      

      const processedResult = await processResult({
        resultData: {
          score,
          topic: learningTopic || topic || null,
          technicalScore: technicalScore || score || 0,
          learningScore: learningScore || null,
          technicalLevel: effectiveTechnicalLevel,
          learningStyle: effectiveLearningStyle,
          psychometricProfile: combinedAnalysis?.psychometricProfile || null,
        },
        userContext: {
          userId,
          sourceType,
          sourceUrl,
          extractedText,
          skills,
          strengths,
          weakAreas,
        },
        contentData: material,
        roadmapData: null,
      });

      const roadmapData = processedResult.roadmapData || {
        learningPath:
          material.sections?.map((section) => `${section.title}: ${section.keyPoints?.join(", ")}`) ||
          [],
        tips: material.learningTips || [],
        finalProject: material.finalProject
      };
      saveAnalysisToDatabase(material, roadmapData);

      localStorage.setItem("learningMaterialData", JSON.stringify(material));
      localStorage.setItem(
        "learningMaterialMeta",
        JSON.stringify({
          topic: learningTopic || topic || "",
          technicalLevel: effectiveTechnicalLevel,
          learningStyle: effectiveLearningStyle,
        })
      );

      

      navigate("/learning-material", {
        state: {
          learningMaterial: material,
          topic: learningTopic || topic,
          technicalLevel: effectiveTechnicalLevel,
          learningStyle: effectiveLearningStyle,
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
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>Level: {effectiveTechnicalLevel}</p>
            </div>

            <div className="stat-card">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>Learning Preference</p>
              <p className="stat-value" style={{ color: 'var(--color-success)' }}>
                {learningScore || 50}%
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>Style: {effectiveLearningStyle}</p>
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

                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Personalized Learning Path</h4>
                    {Array.isArray(personalizedContent.learningPath) && personalizedContent.learningPath.length > 0 ? (
                      <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        {personalizedContent.learningPath.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '10px' }}>{typeof step === "string" ? step : JSON.stringify(step)}</li>
                        ))}
                      </ol>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                        No step-by-step path was returned. Check the overview, resources, and tips below, or try generating again.
                      </p>
                    )}
                  </div>

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
                          {typeof resource === 'string' ? (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                              {resource}
                            </p>
                          ) : (
                            <>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary)' }}>
                                {resource.type}: {resource.title}
                              </p>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                {resource.description}
                              </p>
                            </>
                          )}
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
                    onClick={handleGenerateLearningMaterial}
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
