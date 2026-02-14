import { useState } from "react";
import { useNavigate } from "react-router-dom";

const strategicObjectives = [
  { 
    id: "get_job_ready", 
    label: "Get Job Ready", 
    description: "Prepare yourself to land your dream job with targeted skills and knowledge."
  },
  { 
    id: "improve_programming", 
    label: "Improve Programming", 
    description: "Enhance your coding skills and become a better programmer."
  },
  { 
    id: "prepare_interviews", 
    label: "Prepare for Interviews", 
    description: "Master technical interview questions and ace your next opportunity."
  },
  { 
    id: "learn_new_technology", 
    label: "Learn New Technology", 
    description: "Explore and adopt new technologies to expand your skill set."
  }
];

const workflowSteps = [
  { 
    number: 1,
    title: "Resume Processing", 
    description: "We extract and classify your technical competencies from your submitted resume."
  },
  { 
    number: 2,
    title: "Adaptive Quiz Generation", 
    description: "We generate personalized assessment questions based on your profile."
  },
  { 
    number: 3,
    title: "Skill Gap Identification", 
    description: "We identify specific areas where your skills diverge from target roles."
  },
  { 
    number: 4,
    title: "Role Alignment Analysis", 
    description: "We analyze how your profile aligns with various technical positions."
  },
  { 
    number: 5,
    title: "Personalized Learning Plan", 
    description: "We generate a structured roadmap tailored to your career objectives."
  }
];

function OnboardingWizard({ userId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Don't save anything, just close the wizard
    onComplete();
  };

  const handleSaveOnboarding = async () => {
    if (!selectedObjective) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/onboarding/goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          careerGoal: selectedObjective
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsComplete(true);
        // Automatically navigate to dashboard after a brief delay
        setTimeout(() => {
          onComplete();
          navigate("/");
        }, 1500);
      } else {
        console.error("Failed to save:", data.error);
      }
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    onComplete();
    navigate("/");
  };

  const canProceed = () => {
    if (currentStep === 3) {
      return selectedObjective !== null;
    }
    return true;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Close Button */}
        <button 
          style={styles.closeButton} 
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Progress Indicator */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBarWrapper}>
            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill,
                width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%'
              }} />
            </div>
          </div>
          <div style={styles.stepsContainer}>
            {[1, 2, 3].map((step) => (
              <div key={step} style={styles.stepIndicator}>
                <div style={{
                  ...styles.stepCircle,
                  ...(currentStep >= step ? styles.stepCircleActive : {}),
                  ...(currentStep > step ? styles.stepCircleCompleted : {})
                }}>
                  {currentStep > step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span style={{
                  ...styles.stepLabel,
                  ...(currentStep >= step ? styles.stepLabelActive : {})
                }}>
                  {step === 1 ? 'Overview' : step === 2 ? 'Process' : 'Objective'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={styles.stepContent}>
          
          {/* Step 1: Platform Overview */}
          {currentStep === 1 && (
            <div style={styles.stepInner}>
              <h1 style={styles.title}>AI Skill Intelligence Platform</h1>
              <p style={styles.description}>
                This platform analyzes your technical profile and generates a personalized development strategy.
              </p>
              
              <div style={styles.divider} />
              
              <div style={styles.contentBlocks}>
                <div style={styles.contentBlock}>
                  <h3 style={styles.contentBlockTitle}>Profile Analysis</h3>
                  <p style={styles.contentBlockText}>We extract and classify your technical competencies.</p>
                </div>
                
                <div style={styles.contentBlock}>
                  <h3 style={styles.contentBlockTitle}>Knowledge Evaluation</h3>
                  <p style={styles.contentBlockText}>We assess your understanding through adaptive testing.</p>
                </div>
                
                <div style={styles.contentBlock}>
                  <h3 style={styles.contentBlockTitle}>Development Roadmap</h3>
                  <p style={styles.contentBlockText}>We generate a structured learning strategy based on performance gaps.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: How Your Assessment Works */}
          {currentStep === 2 && (
            <div style={styles.stepInner}>
              <h1 style={styles.title}>How Your Assessment Works</h1>
              
              <div style={styles.divider} />
              
              <div style={styles.workflow}>
                {workflowSteps.map((step) => (
                  <div key={step.number} style={styles.workflowStep}>
                    <div style={styles.workflowNumber}>{step.number}</div>
                    <div style={styles.workflowContent}>
                      <h3 style={styles.workflowTitle}>{step.title}</h3>
                      <p style={styles.workflowDescription}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Strategic Objective Selection */}
          {currentStep === 3 && !isComplete && (
            <div style={styles.stepInner}>
              <h1 style={styles.title}>Select Your Goal</h1>
              <p style={styles.description}>
                Choose your primary objective to personalize your learning experience.
              </p>
              
              <div style={styles.objectiveList}>
                {strategicObjectives.map((objective) => (
                  <button
                    key={objective.id}
                    style={{
                      ...styles.objectiveCard,
                      ...(selectedObjective === objective.id ? styles.objectiveCardSelected : {})
                    }}
                    onClick={() => setSelectedObjective(objective.id)}
                  >
                    <span style={styles.objectiveLabel}>{objective.label}</span>
                    <span style={styles.objectiveDescription}>{objective.description}</span>
                  </button>
                ))}
              </div>

              <div style={styles.buttonSection}>
                <button 
                  style={{
                    ...styles.continueButton,
                    ...(!canProceed() ? styles.continueButtonDisabled : {})
                  }}
                  onClick={handleSaveOnboarding}
                  disabled={!canProceed() || loading}
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Completion State */}
          {isComplete && (
            <div style={styles.stepInner}>
              <h1 style={styles.successTitle}>Setup Complete</h1>
              <p style={styles.description}>
                Your assessment profile has been configured. You may now proceed to the dashboard.
              </p>
              <button style={styles.dashboardButton} onClick={handleGoToDashboard}>
                Go to Dashboard
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '8px'}}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!isComplete && currentStep < 3 && (
          <div style={styles.buttonContainer}>
            {currentStep > 1 && (
              <button style={styles.backButton} onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <div style={styles.spacer} />
            <button 
              style={styles.nextButton} 
              onClick={handleNext}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '6px'}}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Trust Element */}
        <p style={styles.trustText}>
          Your data is securely processed and never shared with third parties.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out"
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "40px",
    maxWidth: "640px",
    width: "95%",
    maxHeight: "90vh",
    overflowY: "auto",
    border: "1px solid #E2E8F0",
    position: "relative",
    animation: "fadeIn 0.3s ease-out"
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "transparent",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
    transition: "all 0.2s ease",
    zIndex: 10
  },
  progressContainer: {
    marginBottom: "32px"
  },
  progressBarWrapper: {
    marginBottom: "16px"
  },
  progressBarBg: {
    height: "4px",
    backgroundColor: "#E2E8F0",
    borderRadius: "2px",
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0EA5E9",
    borderRadius: "2px",
    transition: "width 0.3s ease"
  },
  stepsContainer: {
    display: "flex",
    justifyContent: "space-between"
  },
  stepIndicator: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  stepCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#E2E8F0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.2s ease"
  },
  stepCircleActive: {
    backgroundColor: "#0EA5E9",
    color: "#ffffff"
  },
  stepCircleCompleted: {
    backgroundColor: "#0F172A",
    color: "#ffffff"
  },
  stepLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  stepLabelActive: {
    color: "#0F172A"
  },
  stepContent: {
    minHeight: "320px"
  },
  stepInner: {
    textAlign: "left"
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "12px",
    lineHeight: "1.3"
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "12px",
    lineHeight: "1.3"
  },
  description: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: "1.6",
    marginBottom: "0"
  },
  divider: {
    height: "1px",
    backgroundColor: "#E2E8F0",
    margin: "24px 0"
  },
  contentBlocks: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  contentBlock: {
    padding: "16px 20px",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF"
  },
  contentBlockTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "6px"
  },
  contentBlockText: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: "1.5",
    margin: 0
  },
  workflow: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  workflowStep: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px"
  },
  workflowNumber: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#0EA5E9",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
    flexShrink: 0
  },
  workflowContent: {
    flex: 1,
    paddingTop: "4px"
  },
  workflowTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  workflowDescription: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: "1.5",
    margin: 0
  },
  objectiveList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "24px"
  },
  objectiveCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px 20px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    width: "100%"
  },
  objectiveCardSelected: {
    backgroundColor: "#F0F9FF",
    borderLeft: "4px solid #0EA5E9",
    borderColor: "#0EA5E9"
  },
  objectiveLabel: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  objectiveDescription: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.4",
    margin: 0
  },
  buttonSection: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "flex-end"
  },
  continueButton: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#0EA5E9",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  continueButtonDisabled: {
    backgroundColor: "#E2E8F0",
    cursor: "not-allowed",
    color: "#94a3b8"
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "32px"
  },
  spacer: {
    flex: 1
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  nextButton: {
    display: "flex",
    alignItems: "center",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#0EA5E9",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  dashboardButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "#0EA5E9",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "24px"
  },
  trustText: {
    textAlign: "left",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "24px"
  }
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  button:hover:not(:disabled) {
    filter: brightness(1.05);
  }
  button:active:not(:disabled) {
    filter: brightness(0.95);
  }
  @media (max-width: 640px) {
    .onboarding-modal { padding: 32px 20px !important; }
  }
`;
document.head.appendChild(styleSheet);

export default OnboardingWizard;
