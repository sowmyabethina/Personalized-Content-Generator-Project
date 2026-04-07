import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ENDPOINTS from "../config/api";

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

  // URL Parsing Function - Extract username from GitHub Profile URL
  const extractGithubUsername = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Remove trailing slash
    let cleanUrl = url.trim().replace(/\/$/, '');
    
    // Check if it's a valid GitHub profile URL
    const githubProfileRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-_]+$/;
    
    if (!githubProfileRegex.test(cleanUrl)) {
      return null;
    }
    
    // Extract username from URL
    const parts = cleanUrl.split('/');
    const username = parts[parts.length - 1];
    
    // Validate username format
    if (username && /^[a-zA-Z0-9-_]+$/.test(username)) {
      return username;
    }
    
    return null;
  };

  // Fetch repositories from GitHub API
  const fetchGithubRepos = async (username) => {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Unable to fetch GitHub data');
    }
    
    const repos = await response.json();
    return repos;
  };

  // Fetch commit-derived skills from backend service (uses server-side token if configured)
  const fetchGithubSkillsFromBackend = async (username) => {
    const response = await fetch(ENDPOINTS.GITHUB.EXTRACT_SKILLS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody?.error || "Unable to extract skills from backend");
    }

    const data = await response.json();
    return Array.isArray(data?.skills) ? data.skills : [];
  };

  // Extract skills from repositories (language + name keywords) + commit-based file analysis
  const extractSkillsFromRepos = async (repos, username) => {
    const skillsSet = new Set();
    const commitSkillsSet = new Set();
    
    // Common programming language keywords
    const languageKeywords = {
      'JavaScript': ['JavaScript', 'JS', 'React', 'Vue', 'Angular', 'Node', 'Express'],
      'TypeScript': ['TypeScript', 'TS', 'Angular', 'React'],
      'Python': ['Python', 'Django', 'Flask', 'FastAPI', 'Machine Learning', 'AI'],
      'Java': ['Java', 'Spring', 'Android', 'Hibernate'],
      'C++': ['C++', 'C Plus Plus'],
      'C#': ['C#', 'C Sharp', '.NET', 'ASP.NET'],
      'Go': ['Go', 'Golang'],
      'Rust': ['Rust'],
      'Swift': ['Swift', 'iOS', 'macOS'],
      'Kotlin': ['Kotlin', 'Android'],
      'Ruby': ['Ruby', 'Rails'],
      'PHP': ['PHP', 'Laravel', 'WordPress'],
      'HTML': ['HTML', 'HTML5'],
      'CSS': ['CSS', 'CSS3', 'Sass', 'SCSS'],
      'SQL': ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
      'Shell': ['Shell', 'Bash', 'Linux'],
      'Docker': ['Docker', 'Kubernetes', 'DevOps'],
      'AWS': ['AWS', 'Amazon Web Services', 'Cloud'],
      'React': ['React', 'ReactJS', 'Redux'],
      'Vue': ['Vue', 'VueJS', 'Nuxt'],
    };

    // Added: extension-based commit skill mapping
    const extensionSkillMap = {
      js: 'JavaScript',
      jsx: 'React',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      css: 'CSS'
    };

    // Added: commit-based extraction (target user's contributions only)
    try {
      const repoCandidates = repos.slice(0, 5);
      const commitSkillResults = await Promise.all(
        repoCandidates.map(async (repo) => {
          try {
            const commitsRes = await fetch(
              `https://api.github.com/repos/${repo.owner?.login}/${repo.name}/commits?author=${encodeURIComponent(username)}&per_page=5`,
              { headers: { Accept: 'application/vnd.github.v3+json' } }
            );
            if (!commitsRes.ok) return [];

            const commits = await commitsRes.json();
            if (!Array.isArray(commits) || commits.length === 0) return [];

            const detailResults = await Promise.all(
              commits.slice(0, 5).map(async (commit) => {
                try {
                  const sha = commit?.sha;
                  if (!sha) return [];

                  const detailRes = await fetch(
                    `https://api.github.com/repos/${repo.owner?.login}/${repo.name}/commits/${sha}`,
                    { headers: { Accept: 'application/vnd.github.v3+json' } }
                  );
                  if (!detailRes.ok) return [];

                  const detail = await detailRes.json();
                  const files = Array.isArray(detail?.files) ? detail.files : [];

                  const fileSkills = [];
                  files.forEach((file) => {
                    const filename = file?.filename || '';
                    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
                    const mappedSkill = extensionSkillMap[ext];
                    if (mappedSkill) fileSkills.push(mappedSkill);
                  });
                  return fileSkills;
                } catch {
                  return [];
                }
              })
            );

            return detailResults.flat();
          } catch {
            return [];
          }
        })
      );

      commitSkillResults.flat().forEach((skill) => commitSkillsSet.add(skill));
    } catch {
      // fallback to existing logic only
    }

    // Existing extraction logic preserved
    repos.forEach(repo => {
      // Add language if available
      if (repo.language) {
        skillsSet.add(repo.language);
        
        // Add related keywords
        if (languageKeywords[repo.language]) {
          languageKeywords[repo.language].forEach(keyword => {
            skillsSet.add(keyword);
          });
        }
      }
      
      // Add skills from repo name
      if (repo.name) {
        const nameLower = repo.name.toLowerCase();
        Object.keys(languageKeywords).forEach(lang => {
          if (nameLower.includes(lang.toLowerCase())) {
            skillsSet.add(lang);
          }
        });
      }
      
      // Add topics/tags from repo
      if (repo.topics && Array.isArray(repo.topics)) {
        repo.topics.forEach(topic => {
          skillsSet.add(topic);
        });
      }
      
      // Add description keywords if available
      if (repo.description) {
        const descLower = repo.description.toLowerCase();
        Object.keys(languageKeywords).forEach(lang => {
          if (descLower.includes(lang.toLowerCase())) {
            skillsSet.add(lang);
          }
        });
      }
    });
    
    // Added: prioritize commit-based skills by ordering them first
    return [...commitSkillsSet, ...Array.from(skillsSet)];
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      extractGithubProfile();
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

  const extractGithubProfile = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Validate URL
      const username = extractGithubUsername(githubProfileUrl);
      
      if (!username) {
        setError("Please enter a valid GitHub profile URL (e.g., https://github.com/username)");
        setLoading(false);
        return;
      }

      // Fetch repositories from GitHub API (used for content summary display)
      const repos = await fetchGithubRepos(username);

      if (!repos || repos.length === 0) {
        setError("No repositories found for this GitHub profile");
        setLoading(false);
        return;
      }

      // Extract skills from backend first, fallback to existing frontend extraction
      let skills = [];
      try {
        skills = await fetchGithubSkillsFromBackend(username);
      } catch (backendErr) {
        console.warn("Backend GitHub extraction failed, falling back to frontend extraction:", backendErr.message);
      }

      if (!Array.isArray(skills) || skills.length === 0) {
        skills = await extractSkillsFromRepos(repos, username);
      }
      
      if (skills.length === 0) {
        setError("Unable to extract skills from repositories");
        setLoading(false);
        return;
      }

      setExtractedSkills(skills);
      
      // Create content from skills for quiz generation
      const skillsContent = `GitHub Profile: ${username}\n\nSkills: ${skills.join(', ')}\n\nRepositories:\n${repos.slice(0, 10).map(r => `- ${r.name}: ${r.language || 'Unknown'} - ${r.description || 'No description'}`).join('\n')}`;
      
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
      if (err.message.includes('Unable to fetch')) {
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

      const res = await fetch(ENDPOINTS.PDF.READ_RESUME, {
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
    
    if (!extractedContent || extractedContent.trim().length < 200) {
      setError("Document too short to generate questions. Provide a longer PDF or use a topic.");
      setLoading(false);
      return;
    }

    try {
      // Use the centralized agent for quiz generation
      const res = await fetch(ENDPOINTS.AGENT.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Generate quiz questions from the document",
          context: {
            pdfText: extractedContent
          }
        })
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
      console.log("🤖 Agent response for quiz:", data);

      // Parse questions from agent response
      let parsedQuestions = [];
      const questionData = data.data?.questions || data.data || [];
      
      if (Array.isArray(questionData)) {
        parsedQuestions = questionData.map(q => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [q.options],
          answer: q.answer || q.correctAnswer || q.options?.[0],
          explanation: q.explanation || "",
          category: q.category || ""
        }));
      } else if (typeof questionData === 'string') {
        try {
          const jsonParsed = JSON.parse(questionData);
          if (Array.isArray(jsonParsed)) {
            parsedQuestions = jsonParsed.map(q => ({
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [q.options],
              answer: q.answer || q.correctAnswer || q.options?.[0],
              explanation: q.explanation || "",
              category: q.category || ""
            }));
          }
        } catch (e) {
          parsedQuestions = parseQuestionsFromText(questionData);
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
            answer: correct?.trim(),
            explanation: q.explanation || "",
            category: q.category || ""
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
            sourceUrl: inputType === "github" ? githubProfileUrl : null,
            extractedText: extractedContent.substring(0, 12000),
            skills: extractedSkills
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
