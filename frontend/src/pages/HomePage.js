import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ENDPOINTS from "../config/api";
import { processProfile } from "../services/github/githubService";
import { requestJson } from "../utils/http";
import useQuizGeneration from "../hooks/quiz/useQuizGeneration";

function HomePage() {
  const navigate = useNavigate();

  const [inputType, setInputType] = useState("github"); // "github" or "resume"
  const [githubProfileUrl, setGithubProfileUrl] = useState("");
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const [extractedContent, setExtractedContent] = useState("");
  const [isExtracted, setIsExtracted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { generateQuestions } = useQuizGeneration();

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      extractGithubProfile();
    }
  };


  const extractGithubProfile = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const { skills, content: skillsContent } = await processProfile(githubProfileUrl);
      
      if (skills.length === 0) {
        setError("Unable to extract skills from repositories");
        setLoading(false);
        return;
      }

      setExtractedSkills(skills);
      
      setExtractedContent(skillsContent);
      setIsExtracted(true);
      setSuccessMessage("GitHub profile analyzed successfully!");
      
      localStorage.setItem("extractedContent", skillsContent);
      localStorage.setItem("documentSourceType", inputType);
      localStorage.setItem("documentSourceUrl", githubProfileUrl);
      localStorage.setItem("extractedSkills", JSON.stringify(skills));
      localStorage.removeItem("currentAnalysisId");
      
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error(err);
      if (err.message.includes("GitHub user not found")) {
        setError("GitHub user not found. Please check the profile URL and try again.");
      } else if (err.message.includes("rate limit")) {
        setError("GitHub API rate limit exceeded. Please try again later or configure a backend GitHub token.");
      } else if (err.message.includes('Unable to fetch')) {
        setError("Unable to fetch GitHub data. Please check the URL and try again.");
      } else {
        setError("Failed to analyze GitHub profile. Please try again.");
      }
    }

    setLoading(false);
  };

  // Extract document for resume PDF
  const extractDocument = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!resumeFile) {
        setError("Please upload a Resume PDF file");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("pdf", resumeFile);

      const data = await requestJson(
        ENDPOINTS.PDF.READ_RESUME,
        {
          method: "POST",
          body: formData,
        },
        "Failed to extract text from Resume PDF"
      );

      if (!data?.text) {
        setError(data.error || "Failed to extract text from Resume PDF");
        setLoading(false);
        return;
      }

      setExtractedContent(data.text);
      setIsExtracted(true);
      setSuccessMessage("Resume PDF extracted successfully!");
      
      localStorage.setItem("extractedContent", data.text);
      localStorage.setItem("documentSourceType", inputType);
      localStorage.removeItem("currentAnalysisId");
      localStorage.removeItem("documentSourceUrl");
      
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error(err);
      setError("Document extraction failed. Please try again.");
    }

    setLoading(false);
  };

  const generateQuiz = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const sourceType = localStorage.getItem("documentSourceType") || inputType;
      const topicFallback = extractedSkills.filter(Boolean).join(", ");
      const shouldUseTopicQuiz =
        sourceType === "github" &&
        (!extractedContent || extractedContent.trim().length < 1000) &&
        topicFallback.length > 0;

      const { questions: parsedQuestions } = await generateQuestions({
        extractedText: shouldUseTopicQuiz ? "" : extractedContent,
        topic: shouldUseTopicQuiz ? topicFallback : "",
        userId: null,
        sourceType: shouldUseTopicQuiz ? "github" : sourceType,
      });

      if (parsedQuestions.length > 0) {
        setSuccessMessage(
          shouldUseTopicQuiz
            ? "Using topic-based quiz from extracted GitHub skills."
            : "Questions generated successfully!"
        );
        setTimeout(() => setSuccessMessage(""), 3000);

        localStorage.removeItem("currentAnalysisId");

        navigate("/quiz", {
          state: { 
            questions: parsedQuestions, 
            quizId: null,
            userId: null,
            sourceType,
            sourceUrl: sourceType === "github" ? githubProfileUrl : null,
            extractedText: extractedContent.substring(0, 12000),
            skills: extractedSkills
          }
        });
      } else {
        setError("Could not parse questions. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      if (extractedContent && extractedContent.trim().length < 1000 && extractedSkills.length > 0) {
        setError("Unable to generate quiz from GitHub skills. Please try again.");
      } else if (!extractedContent || extractedContent.trim().length < 200) {
        setError("Document too short to generate questions. Provide a longer PDF or use a GitHub profile.");
      } else {
        setError(`Error: ${err.message}`);
      }
    }

    setLoading(false);
  };

  // Initial state - Document extraction
  if (!isExtracted) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">Intelligent Personalized <span style={{ color: 'var(--color-navbar-teal)' }}>Learning Platform</span></h1>
            
          </div>
          
          <div className="content-card">
            <h3 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>
              Get Started with Your Profile
            </h3>
            
            {/* Input Type Toggle */}
            <div className="toggle-group">
              <button
                onClick={() => {
                  setInputType("github");
                  setResumeFile(null);
                  setGithubProfileUrl("");
                  setExtractedSkills([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className={`toggle-btn ${inputType === "github" ? "active" : ""}`}
              >
                GitHub Profile
              </button>
              <button
                onClick={() => {
                  setInputType("resume");
                  setGithubProfileUrl("");
                  setExtractedSkills([]);
                }}
                className={`toggle-btn ${inputType === "resume" ? "active" : ""}`}
              >
                Upload Resume
              </button>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="extracting-progress">
                <div className="pulsing-orb"></div>
                <p className="extracting-text">Extracting Document...</p>
                <p className="extracting-subtext">Our AI is analyzing your content</p>
                <div className="progress-bar-container">
                  <div className="progress-bar"></div>
                </div>
              </div>
            )}
            
            {!loading && (
              <>
                {inputType === "github" ? (
                  <>
                    <div className="info-box">
                      <p>
                        Enter your GitHub profile URL to analyze your repositories and extract skills.<br />
                        Example: https://github.com/username
                      </p>
                    </div>
                    <input
                      type="text"
                      id="github-profile-url"
                      name="githubProfileUrl"
                      placeholder="Enter GitHub Profile URL (e.g., https://github.com/username)"
                      value={githubProfileUrl}
                      onChange={(e) => setGithubProfileUrl(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="enterprise-input"
                    />
                  </>
                ) : (
                  <>
                    <div className="info-box">
                      <p>
                        Upload your resume in PDF format to analyze your skills and generate personalized recommendations.
                      </p>
                    </div>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="resume-file"
                        name="resumeFile"
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type === "application/pdf") {
                            setResumeFile(file);
                          } else {
                            setError("Please select a valid PDF file");
                            setResumeFile(null);
                          }
                        }}
                      />
                    </div>
                    {resumeFile && (
                      <p className="selected-file">
                        ✓ Selected: {resumeFile.name}
                      </p>
                    )}
                  </>
                )}

                <button
                  onClick={inputType === "github" ? extractGithubProfile : extractDocument}
                  disabled={loading || (inputType === "resume" && !resumeFile) || (inputType === "github" && !githubProfileUrl.trim())}
                  className={`enterprise-btn ${loading ? 'loading' : ''}`}
                  style={{ marginTop: '16px' }}
                >
                  {loading ? "Analyzing Profile..." : " Analyze Profile"}
                </button>

                {error && <p className="message error">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Extracted content preview - Second state
  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">Intelligent Personalized <span style={{ color: 'var(--color-navbar-teal)' }}>Learning Platform</span></h1>
          <p className="page-subtitle">Content extracted successfully</p>
        </div>
        
        <div className="content-card">
          <h3 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>
            {loading ? "Preparing Your Quiz..." : "Content Extracted"}
          </h3>
          
          {/* Loading State for Quiz Generation */}
          {loading && (
            <div className="extracting-progress">
              <div className="pulsing-orb"></div>
              <p className="extracting-text">Generating Quiz...</p>
              <p className="extracting-subtext">Creating personalized questions for you</p>
              <div className="progress-bar-container">
                <div className="progress-bar"></div>
              </div>
            </div>
          )}
          
          {!loading && (
            <>
              <div className="content-preview">
                <label>Source:</label>
                <span className="source-badge">
                  {inputType === "resume" ? "Resume PDF" : "GitHub Profile"}
                </span>
                <textarea
                  id="extracted-preview"
                  name="extractedPreview"
                  rows="4"
                  value={extractedContent.substring(0, 500) + "..."}
                  readOnly
                />
              </div>

              <div className="button-group">
                <button
                  onClick={generateQuiz}
                  disabled={loading}
                  className={`enterprise-btn success ${loading ? 'loading' : ''}`}
                >
                  {loading ? "⏳ Generating Quiz..." : " Start Quiz"}
                </button>

                <button
                  onClick={() => {
                    setGithubProfileUrl("");
                    setResumeFile(null);
                    setExtractedContent("");
                    setExtractedSkills([]);
                    setIsExtracted(false);
                    setError("");
                    localStorage.removeItem("extractedSkills");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="enterprise-btn secondary"
                >
                   Start Over
                </button>
              </div>
            </>
          )}

          {successMessage && !loading && (
            <p className="message success">{successMessage}</p>
          )}
          {error && !loading && <p className="message error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
