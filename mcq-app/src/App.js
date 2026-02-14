import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import ResultPage from "./pages/ResultPage";
import LearningMaterialPage from "./pages/LearningMaterialPage";
import PdfChatPage from "./pages/PdfChatPage";
import LearningProgressPage from "./pages/LearningProgressPage";
import OnboardingWizard from "./components/OnboardingWizard";
import "./App.css";

function App() {
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/analyses?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.analyses) {
          // Check if user has no analysis OR onboarding is not completed
          const hasExistingAnalysis = data.analyses.length > 0;
          const onboardingCompleted = data.analyses.some(a => a.onboardingCompleted === true);

          if (!hasExistingAnalysis || !onboardingCompleted) {
            setShowOnboarding(true);
          }
        } else {
          // No analyses found, show onboarding
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        // Show onboarding on error to be safe
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  return (
    <div className="app-wrapper">
      <SignedOut>
        <div className="split-layout">
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-logo">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                </svg>
                <span className="hero-logo-text">Personalized Content Generator</span>
              </div>
              <h1 className="hero-title">AI-Powered Personalized Content Generation</h1>
              <p className="hero-description">
                Transform the way you create and consume content. Our intelligent platform generates personalized learning materials, assessments, and insights based on your unique profile, skills, documents, and preferences.
              </p>
              <div className="hero-features">
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="feature-info">
                    <h3>PDF & Document Processing</h3>
                    <p>Extract insights from your documents instantly</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M16 13H8"/>
                      <path d="M16 17H8"/>
                    </svg>
                  </div>
                  <div className="feature-info">
                    <h3>Resume Analysis</h3>
                    <p>Smart parsing for better career insights</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div className="feature-info">
                    <h3>Skill-Based Content</h3>
                    <p>Personalized to your expertise level</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <div className="feature-info">
                    <h3>Instant AI Generation</h3>
                    <p>Fast results powered by advanced AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="login-section">
            <div className="login-card">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "clerk-root-box",
                    card: "clerk-card",
                    headerTitle: "clerk-header-title",
                    headerSubtitle: "clerk-header-subtitle",
                    formButtonPrimary: "clerk-button",
                    footerActionLink: "clerk-footer-link",
                    socialButtonsBlockButton: "clerk-social-button",
                    socialButtonsBlockButtonText: "clerk-social-button-text",
                    socialButtonsBlockButtonIcon: "clerk-socialButtonsBlockButtonIcon",
                    socialButtonsBlock: "clerk-social-buttons",
                    socialButtonsBlockButtonInner: "clerk-socialButtonButtonInner",
                    identityPreviewText: "clerk-identity-text",
                    identityPreviewEditButton: "clerk-identity-edit",
                    dividerRow: "clerk-divider",
                    formFieldLabel: "clerk-field-label",
                    formFieldInput: "clerk-field-input",
                    alert: "clerk-alert",
                    formFieldAction: "clerk-form-field-action",
                    formFieldRow: "clerk-form-field-row",
                    main: "clerk-main",
                    footer: "clerk-footer",
                    footerAction: "clerk-footer-action",
                    footerActionText: "clerk-footer-action-text",
                    footerBranding: "clerk-footer-branding",
                    footerItem: "clerk-footer-item",
                    footerSupportText: "clerk-footer-supportText",
                    footerLogoLink: "clerk-footer-logoLink",
                    socialButtonsProviderIcon: "clerk-social-button-icon",
                  },
                  variables: {
                    colorPrimary: "#2563eb",
                    colorBackground: "#ffffff",
                    colorInputBackground: "#ffffff",
                    colorText: "#1f2937",
                    colorTextSecondary: "#64748b",
                    colorDanger: "#b91c1c",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    spacingUnit: "4px",
                    borderRadius: "8px",
                  },
                  layout: {
                    socialButtonsVariant: "blockButton",
                  },
                }}
                localization={{
                  socialButtonsBlockButton: {
                    google: "Google",
                    linkedin: "LinkedIn",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {!isLoading && showOnboarding && user && (
          <OnboardingWizard 
            userId={user.id} 
            onComplete={handleOnboardingComplete} 
          />
        )}
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/learning-material" element={<LearningMaterialPage />} />
            <Route path="/pdf-chat" element={<PdfChatPage />} />
            <Route path="/progress" element={<LearningProgressPage />} />
          </Routes>
        </Layout>
      </SignedIn>
    </div>
  );
}

export default App;
