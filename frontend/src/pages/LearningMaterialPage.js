import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useAnalyses from "../hooks/useAnalyses";
import {
  calculateReadiness,
  dedupeAnalysesByTopic,
  formatAnalysisDate,
  formatTopic,
  getAnalysisScore,
} from "../utils/analysis/analysisHelpers";
import {
  buildLearningMaterialQuizState,
  calculateTotalEstimatedTime,
  getStoredScore,
} from "../utils/learning/learningNavigation";

// Import extracted components
import {
  EstimatedTime,
  LessonContent,
  CompletionScreen
} from "./LearningMaterialPage/components";

import { processMaterial } from "../services/learning/learningMaterialService";
import { coerceDisplayString, coerceExampleRecord } from "../utils/learning/coerceDisplayString";

// Import global constants
import { LEARNING_STYLES, TECHNICAL_LEVELS, ERROR_MESSAGES } from "../constants/learningConstants";
import { EXTERNAL_URLS, PAGES } from "../constants/config.constants";

// Import component styles
import { styles, dashboardStyles } from "../components/learningMaterialStyles";

function LearningMaterialPage() {
  const youtubeSearchBaseUrl = EXTERNAL_URLS.YOUTUBE_SEARCH_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state || {};
  
  // Check if we have learning material data passed via navigation state
  const { learningMaterial, topic, technicalLevel, learningStyle, reset } = navigationState;
  let storedMaterial = null;
  let storedMaterialMeta = null;

  try {
    storedMaterial = JSON.parse(localStorage.getItem("learningMaterialData") || "null");
    storedMaterialMeta = JSON.parse(localStorage.getItem("learningMaterialMeta") || "null");
  } catch (storageError) {
    storedMaterial = null;
    storedMaterialMeta = null;
  }

  const activeLearningMaterial = learningMaterial || (reset ? storedMaterial : null);
  const activeTopic = topic || (reset ? storedMaterialMeta?.topic : "");
  const activeTechnicalLevel = technicalLevel || (reset ? storedMaterialMeta?.technicalLevel : "");
  const activeLearningStyle = learningStyle || (reset ? storedMaterialMeta?.learningStyle : "");
  
  // If we have learning material data, we're in "display material" mode
  const isDisplayingMaterial = !!activeLearningMaterial;
  
  const { userId: rawUserId } = navigationState;
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

  const { analyses, loading, loadAnalyses } = useAnalyses(userId, { autoLoad: false, initialLoading: true });
  const [showAllAssessments] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const uniqueAnalyses = dedupeAnalysesByTopic(analyses);

  // Step-by-step learning state
  const [currentStep, setCurrentStep] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  // Save progress to localStorage
  useEffect(() => {
    if (isDisplayingMaterial && activeTopic) {
      localStorage.setItem(`lesson_progress_${activeTopic}`, JSON.stringify({
        currentStep,
        completedAt: new Date().toISOString()
      }));
    }
  }, [activeTopic, currentStep, isDisplayingMaterial]);
  
  // Handle exit with confirmation
  const handleExit = () => {
    setShowExitDialog(true);
  };
  
  const confirmExit = () => {
    // Progress already saved via useEffect
    navigate(PAGES.RESULT, { state: { topic: activeTopic, technicalScore: getStoredScore("technicalScore") } });
  };
  
  const cancelExit = () => {
    setShowExitDialog(false);
  };
  
  // Handle PDF download - generates a PDF file from lesson content
  const handleDownloadPDF = async () => {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = 20;
    const titleFontSize = 18;
    const subtitleFontSize = 14;
    const bodyFontSize = 11;
    
    // Helper function to add new page if needed
    const checkNewPage = (neededSpace) => {
      if (yPos + neededSpace > 280) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };
    
    // Helper function to wrap text (never pass raw objects to jsPDF)
    const wrapText = (text, maxWidth) => {
      const s = coerceDisplayString(text) || " ";
      return doc.splitTextToSize(s, maxWidth);
    };
    
    // Title
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    const title = activeTopic || 'Learning Material';
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Lessons content
    lessons.forEach((lesson, index) => {
      checkNewPage(30);
      
      // Lesson title
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(`Lesson ${index + 1}: ${coerceDisplayString(lesson.title)}`, margin, yPos);
      yPos += 8;
      
      // Estimated time
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Estimated Time: ${coerceDisplayString(lesson.estimatedTime || 'N/A')}`, margin, yPos);
      yPos += 10;
      
      // Summary
      if (lesson.sections?.summary) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const summaryLines = wrapText(lesson.sections.summary, maxWidth);
        doc.text(summaryLines, margin, yPos);
        yPos += (summaryLines.length * 5) + 8;
      }
      
      // Important Concept
      if (lesson.sections?.importantConcept) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Important Concept', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const conceptLines = wrapText(lesson.sections.importantConcept, maxWidth);
        doc.text(conceptLines, margin, yPos);
        yPos += (conceptLines.length * 5) + 8;
      }
      
      // Key Points
      if (lesson.sections?.keyPoints && lesson.sections.keyPoints.length > 0) {
        checkNewPage(15 + (lesson.sections.keyPoints.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Points', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.keyPoints.forEach((point, i) => {
          const pointLines = wrapText(`${i + 1}. ${point}`, maxWidth - 5);
          doc.text(pointLines, margin + 3, yPos);
          yPos += (pointLines.length * 5);
        });
        yPos += 5;
      }
      
      // Examples
      if (lesson.sections?.examples && lesson.sections.examples.length > 0) {
        checkNewPage(15 + (lesson.sections.examples.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Examples', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.examples.forEach((ex, i) => {
          const block =
            typeof ex === "string"
              ? `${i + 1}. ${ex}`
              : (() => {
                  const r = coerceExampleRecord(ex);
                  return [
                    `${i + 1}. ${r.title || "Example"}`,
                    r.description,
                    r.code ? `Code:\n${r.code}` : "",
                    r.output ? `Output:\n${r.output}` : "",
                  ]
                    .filter((line) => line && String(line).trim())
                    .join("\n\n");
                })();
          const exLines = wrapText(block, maxWidth - 5);
          doc.text(exLines, margin + 3, yPos);
          yPos += Math.max(exLines.length, 1) * 5 + 4;
        });
        yPos += 5;
      }
      
      // Practice Questions
      if (lesson.sections?.practiceQuestions && lesson.sections.practiceQuestions.length > 0) {
        checkNewPage(15 + (lesson.sections.practiceQuestions.length * 5));
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Practice Questions', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        lesson.sections.practiceQuestions.forEach((q, i) => {
          const qLines = wrapText(`${i + 1}. ${q}`, maxWidth - 5);
          doc.text(qLines, margin + 3, yPos);
          yPos += (qLines.length * 5);
        });
        yPos += 5;
      }
      
      // Quick Revision
      if (lesson.sections?.quickRevision) {
        checkNewPage(20);
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Quick Revision', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const revisionLines = wrapText(lesson.sections.quickRevision, maxWidth);
        doc.text(revisionLines, margin, yPos);
        yPos += (revisionLines.length * 5) + 10;
      }
      
      // Separator line between lessons
      if (index < lessons.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }
    });
    
    // Save the PDF
    const filename = `${(activeTopic || 'learning-material').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    doc.save(filename);
  };
  
  // Scroll to top when step changes
  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle going back to lessons from completion
  const handleBackToLessons = () => {
    setShowCompletion(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Convert learning material to lessons array when displaying material
  useEffect(() => {
    const loadProcessedMaterial = async () => {
      if (isDisplayingMaterial && activeLearningMaterial) {
        const processedMaterial = await processMaterial(activeLearningMaterial, {
          topic: activeTopic,
          technicalLevel: activeTechnicalLevel,
          learningStyle: activeLearningStyle,
        });
        setLessons(processedMaterial.lessons || []);
        setCurrentStep(0);
        setShowCompletion(false);
        setShowExitDialog(false);
      }
    };

    loadProcessedMaterial();
  }, [activeLearningMaterial, activeLearningStyle, activeTechnicalLevel, activeTopic, isDisplayingMaterial]);

  useEffect(() => {
    if (reset && activeTopic) {
      localStorage.removeItem(`lesson_progress_${activeTopic}`);
    }
  }, [activeTopic, reset]);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  const continueLearning = (a) => navigate(PAGES.RESULT, { state: { ...a, mode: "saved" } });

  const latestAssessment = analyses[0] || null;
  const readiness = latestAssessment ? calculateReadiness(latestAssessment.technicalScore || 0, latestAssessment.learningScore || 0) : 0;

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

  // If we have learning material data, display it instead of the progress dashboard
  if (isDisplayingMaterial) {
    const totalSteps = lessons.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const currentLesson = lessons[currentStep] || { 
      title: "Loading...", 
      estimatedTime: "",
      sections: { summary: "", importantConcept: "", thinkQuestion: "", keyPoints: [], realWorldApplications: [], examples: [], practiceQuestions: [], quickRevision: [] }
    };
    
    // Calculate total estimated time
    const totalEstimatedTime = calculateTotalEstimatedTime(lessons);
    
    // Progress percentage
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;
    
    // Show completion screen before quiz
    if (showCompletion) {
      return (
        <div className="lp-page-container">
          <style>{dashboardStyles}</style>
          <div className="lp-content-wrapper">
              <CompletionScreen 
              lessons={lessons}
              onTakeQuiz={() => navigate(PAGES.QUIZ, { 
                state: buildLearningMaterialQuizState(activeLearningMaterial, activeTopic)
              })}
              onGoBack={handleBackToLessons}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="lp-page-container">
        <style>{dashboardStyles}</style>
        <div className="lp-content-wrapper">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
              📚 Learning Material
            </h1>
            {activeTopic && <p style={{ color: '#64748b', marginTop: '8px', fontSize: '16px' }}>Topic: {activeTopic}</p>}
            
            {/* Total Estimated Time */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '6px 14px', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                fontSize: '13px', 
                color: '#64748b',
                fontWeight: '600'
              }}>
                ⏱️ Total: ~{totalEstimatedTime} min
              </span>
              {activeTechnicalLevel && (
                <span style={{ padding: '6px 16px', background: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Level: {activeTechnicalLevel}
                </span>
              )}
              {activeLearningStyle && (
                <span style={{ padding: '6px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Style: {activeLearningStyle}
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              padding: '0 16px'
            }}>
              <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ 
                  color: '#4f46e5', 
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  🔥 {Math.round(progressPercent)}% Done — Keep Going!
                </span>
                <span style={{ 
                  color: '#94a3b8', 
                  fontSize: '13px'
                }}>
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
            </div>
          </div>

          {/* Learning Material Content - Structured Display */}
          <div className="lp-content-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
            {/* Lesson Header */}
            <div style={{ 
              marginBottom: '24px', 
              paddingBottom: '20px', 
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Lesson {currentStep + 1}
                </span>
                <EstimatedTime time={currentLesson.estimatedTime} />
              </div>
              <h2 style={{ color: '#1e293b', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                {currentLesson.title}
              </h2>
            </div>
            
            {/* Structured Lesson Content */}
            <LessonContent
              lesson={currentLesson}
            />

            {/* Navigation Buttons - Sticky at bottom */}
            <div style={{ 
              position: 'sticky',
              bottom: '0',
              background: 'white',
              padding: '20px 24px',
              marginTop: 'auto',
              borderTop: '1px solid #e2e8f0',
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
              zIndex: '100'
            }}>
              {/* Previous Button */}
              <button 
                onClick={() => handleStepChange(Math.max(0, currentStep - 1))} 
                disabled={isFirstStep}
                className="lp-enterprise-btn"
                style={{ 
                  opacity: isFirstStep ? 0.5 : 1,
                  cursor: isFirstStep ? 'not-allowed' : 'pointer',
                  background: isFirstStep ? '#94a3b8' : '#64748b'
                }}
              >
                ← Previous
              </button>
              
              {/* Next/Finish Button */}
              {isLastStep ? (
                <button 
                  onClick={() => navigate(PAGES.QUIZ, { 
                    state: buildLearningMaterialQuizState(activeLearningMaterial, activeTopic)
                  })}
                  className="lp-enterprise-btn"
                  style={{ background: '#059669' }}
                >
                  Take Final Quiz 🚀
                </button>
              ) : (
                <button 
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="lp-enterprise-btn"
                  style={{ background: '#4f46e5' }}
                >
                  Next →
                </button>
              )}
              
              {/* Exit Button - Secondary style */}
              <button 
                onClick={handleExit}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; }}
                onMouseOut={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = 'white'; }}
              >
                Exit
              </button>
              
              {/* Download PDF - Only on last step */}
              {isLastStep && (
                <button 
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '12px 20px',
                    background: '#0ea5e9',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📥 Download Full PDF
                </button>
              )}
            </div>
            
            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '1000',
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '400px',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px' }}>Exit Learning?</h3>
                  <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '15px' }}>Your progress will be saved and you can resume later.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                      onClick={cancelExit}
                      style={{
                        padding: '12px 24px',
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        color: '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmExit}
                      style={{
                        padding: '12px 24px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            )}
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

        {/* 📊 OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="summary-row">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[{l:'Assessments', v:uniqueAnalyses.length, bg:'#eff6ff', c:'#1e40af'}, {l:'Trend', v:'Stable', bg:'#ecfdf5', c:'#065f46'}, {l:'Latest Result', v:`${latestAssessment?.technicalScore || 0}%`, bg:'#fffbeb', c:'#92400e'}, {l:'Learning Type', v:latestAssessment?.learningStyle || 'N/A', bg:'#f5f3ff', c:'#5b21b6'}].map((s,i) => (
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
                      <LineChart data={uniqueAnalyses.slice(0,5).reverse().map(a=>({d:formatAnalysisDate(a.createdAt), s:a.technicalScore}))}>
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
                    {uniqueAnalyses.slice(0, showAllAssessments ? uniqueAnalyses.length : 1).map((a, i) => (
                      <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700' }}>{formatTopic(a.topic)}</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Joined</span><strong>{formatAnalysisDate(uniqueAnalyses[uniqueAnalyses.length-1]?.createdAt)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f0fdf4', borderRadius: '12px' }}><span style={{ color: '#166534' }}>Last Active</span><strong style={{ color: '#166534' }}>{formatAnalysisDate(latestAssessment?.createdAt)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🗺️ ROADMAP TAB */}
        {activeTab === 'roadmap' && uniqueAnalyses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
             
             {/* 🚨 Red: Focus Areas */}
             {uniqueAnalyses.filter(a => getAnalysisScore(a) < 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>🚨 Foundational Skills to Master</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {uniqueAnalyses.filter(a => getAnalysisScore(a) < 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-urgent">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#991b1b' }}>{formatTopic(a.topic)}</h4>
                              <span style={{ color: '#dc2626', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#7f1d1d', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Master basics of {formatTopic(a.topic)} through the course below.</p>
                           <div style={{ display: 'flex', gap: '12px' }}>
                           <a href={`${youtubeSearchBaseUrl}?search_query=${formatTopic(a.topic)}+full+course`} target="_blank" rel="noreferrer" className="lp-enterprise-btn" style={{ flex: 2 }}>📺 Course</a>
                              <button onClick={() => continueLearning(a)} className="lp-enterprise-btn btn-outline-red" style={{ flex: 1 }}>🔄 Retake</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* ✅ Green: Mastered Areas */}
             {uniqueAnalyses.filter(a => getAnalysisScore(a) >= 45).length > 0 && (
                <div>
                   <h3 style={{ color: '#059669', marginBottom: '16px' }}>🏆 Proficiency Achieved</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      {uniqueAnalyses.filter(a => getAnalysisScore(a) >= 45).map((a, idx) => (
                        <div key={idx} className="lp-content-card roadmap-card-success">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, color: '#064e3b' }}>{formatTopic(a.topic)}</h4>
                              <span style={{ color: '#059669', fontWeight: '800' }}>{a.technicalScore}%</span>
                           </div>
                           <p style={{ color: '#064e3b', fontSize: '14px', margin: '16px 0', opacity: 0.8 }}>Excellent grasp! Challenge yourself with advanced projects.</p>
                           <button onClick={() => navigate(PAGES.PDF_CHAT)} className="lp-enterprise-btn" style={{ background: '#059669' }}>🔥 Advanced Practice</button>
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

export default LearningMaterialPage;
