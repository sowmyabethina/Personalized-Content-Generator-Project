import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const [inputType, setInputType] = useState("github"); // "github" or "resume"
  const [githubLink, setGithubLink] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const [extractedContent, setExtractedContent] = useState("");
  const [isExtracted, setIsExtracted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      extractDocument();
    }
  };

  const parseQuestionsFromText = (text) => {
    const questions = [];
    if (!text || typeof text !== "string") return [];

    const sections = text.split(/\*\*Multiple-Choice Questions\*\*|\*\*Multiple Choice Questions\*\*/i);
    const mcqSection = sections.length > 1 ? sections[1] : text;

    const questionBlocks = mcqSection.split(/\n(?=\d+\.)/);

    for (const block of questionBlocks) {
      const lines = block.trim().split("\n").filter(l => l.trim());
      if (lines.length < 4) continue;

      let questionText = lines[0].replace(/^\d+\.\s*/, "").trim();
      questionText = questionText.replace(/http[s]?:\/\/\S+/g, "").trim();

      const options = [];
      let correctAnswer = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)(?:\s*\*?Correct Answer:\*?.*)?$/i);
        if (optionMatch) {
          let optionText = optionMatch[2].trim();
          optionText = optionText.replace(/\*?Correct Answer:\*?\s*[A-D]?\s*$/i, "").trim();

          if (optionText && optionText.length > 0) {
            options.push(optionText);
          }

          if (line.match(/\*?Correct Answer:\*?\s*([A-D])/i)) {
            const match = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);
            correctAnswer = match[1];
          }
        }
      }

      if (questionText && options.length >= 3) {
        const finalOptions = options.slice(0, 4);
        let answerIndex = 0;
        if (correctAnswer) {
          answerIndex = correctAnswer.charCodeAt(0) - 65;
          if (answerIndex < 0 || answerIndex >= finalOptions.length) {
            answerIndex = 0;
          }
        }

        questions.push({
          question: questionText,
          options: finalOptions,
          answer: finalOptions[answerIndex] || finalOptions[0]
        });
      }
    }

    return questions;
  };

  const extractDocument = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (inputType === "resume") {
        if (!resumeFile) {
          setError("Please upload a Resume PDF file");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("pdf", resumeFile);

        const res = await fetch("http://localhost:5000/read-resume-pdf", {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (!res.ok || !data.text) {
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
        if (inputType === "github") {
          localStorage.setItem("documentSourceUrl", githubLink);
        } else {
          localStorage.removeItem("documentSourceUrl");
        }
        
        setTimeout(() => setSuccessMessage(""), 3000);

      } else {
        if (!githubLink.trim()) {
          setError("Please paste a GitHub PDF link");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/read-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ github_url: githubLink })
        });

        const data = await res.json();

        if (!data.text) {
          setError("Failed to extract PDF. Please check the link and try again.");
          setLoading(false);
          return;
        }

        setExtractedContent(data.text);
        setIsExtracted(true);
        setSuccessMessage("PDF extracted successfully!");
        
        localStorage.setItem("extractedContent", data.text);
        localStorage.setItem("documentSourceType", inputType);
        localStorage.removeItem("currentAnalysisId");
        if (inputType === "github") {
          localStorage.setItem("documentSourceUrl", githubLink);
        } else {
          localStorage.removeItem("documentSourceUrl");
        }
        
        setTimeout(() => setSuccessMessage(""), 3000);
      }
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
    
    if (!extractedContent || extractedContent.trim().length < 200) {
      setError("Document too short to generate questions. Provide a longer PDF or use a topic.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        docText: extractedContent.substring(0, 12000)
      };

      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const bodyText = await res.text();
        console.error("Server error:", res.status, bodyText);

        try {
          const parsed = JSON.parse(bodyText);
          if (res.status === 429 || parsed?.error === "rate_limit") {
            setError("AI quota exceeded. Please try again later. See https://ai.dev/rate-limit for usage details.");
          } else {
            setError(`Server error: ${res.status} ${parsed?.error || ""}`);
          }
        } catch (e) {
          if (res.status === 429 || (bodyText && bodyText.toLowerCase().includes("quota"))) {
            setError("AI quota exceeded. Please try again later. See https://ai.dev/rate-limit for usage details.");
          } else {
            setError(`Server error: ${res.status}`);
          }
        }

        setLoading(false);
        return;
      }

      const data = await res.json();
      let parsedQuestions = [];

      if (Array.isArray(data)) {
        parsedQuestions = data.map(q => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [q.options],
          answer: q.answer || q.options[0]
        }));
      } else if (data.questions) {
        let questionsText = typeof data.questions === 'object' ? data.questions.questions : data.questions;

        try {
          const jsonParsed = JSON.parse(questionsText);
          if (Array.isArray(jsonParsed)) {
            parsedQuestions = jsonParsed.map(q => ({
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [q.options],
              answer: q.answer || q.options[0]
            }));
          } else {
            throw new Error("Not an array");
          }
        } catch (e) {
          parsedQuestions = parseQuestionsFromText(questionsText);
        }
      }

      if (parsedQuestions.length > 0) {
        const normalized = parsedQuestions.map(q => {
          let correct = q.answer;
          if (typeof correct === "string" && /^[A-D]$/i.test(correct)) {
            const idx = correct.toUpperCase().charCodeAt(0) - 65;
            correct = q.options[idx];
          }
          if (typeof correct === "number") {
            correct = q.options[correct];
          }
          return {
            ...q,
            answer: correct?.trim()
          };
        });

        setSuccessMessage("Questions generated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        localStorage.removeItem("currentAnalysisId");

        navigate("/quiz", {
          state: { 
            questions: normalized, 
            quizId: res.headers.get("X-Quiz-Id"),
            userId: null,
            sourceType: inputType,
            sourceUrl: inputType === "github" ? githubLink : null,
            extractedText: extractedContent.substring(0, 12000)
          }
        });
      } else {
        setError("Could not parse questions. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  // Initial state - Document extraction
  if (!isExtracted) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title">Intelligent Personalized <span style={{ color: '#5FB0B7' }}>Learning Platform</span></h1>
            
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
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className={`toggle-btn ${inputType === "github" ? "active" : ""}`}
              >
                GitHub URL
              </button>
              <button
                onClick={() => {
                  setInputType("resume");
                  setGithubLink("");
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
                        Paste the direct PDF link from your GitHub repository.<br />
                        Make sure the file is public and accessible.
                      </p>
                    </div>
                    <input
                      type="text"
                      id="github-link"
                      name="githubLink"
                      placeholder="Paste GitHub PDF link"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
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
                  onClick={extractDocument}
                  disabled={loading || (inputType === "resume" && !resumeFile) || (inputType === "github" && !githubLink.trim())}
                  className={`enterprise-btn ${loading ? 'loading' : ''}`}
                  style={{ marginTop: '16px' }}
                >
                  {loading ? "Analyzing Document..." : " Analyze Document"}
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
          <h1 className="page-title">Intelligent Personalized <span style={{ color: '#5FB0B7' }}>Learning Platform</span></h1>
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
                  {inputType === "resume" ? "Resume PDF" : "GitHub PDF"}
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
                    setGithubLink("");
                    setResumeFile(null);
                    setExtractedContent("");
                    setIsExtracted(false);
                    setError("");
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
