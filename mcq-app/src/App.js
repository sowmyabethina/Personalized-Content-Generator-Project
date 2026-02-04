import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  useUser
} from "@clerk/clerk-react";

import { useState } from "react";
import "./App.css";

function App() {
  // ==========================================
  // STEP 1: PDF Extraction & Content States
  // ==========================================
  const [githubLink, setGithubLink] = useState("");
  // const [pdfFile, setPdfFile] = useState(null);  // Optional: for future file upload feature
  const [extractedContent, setExtractedContent] = useState("");
  const [isExtracted, setIsExtracted] = useState(false);
  // const [extractionSuccess, setExtractionSuccess] = useState(false);  // Optional: tracking extracted state

  // ==========================================
  // STEP 2: Quiz & Questions States
  // ==========================================
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState("");
  const [showResult, setShowResult] = useState(false);

  // ==========================================
  // STEP 3: Topic Input for New Quiz States
  // ==========================================
  const [topic, setTopic] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(false);

  // ==========================================
  // STEP 5: Personalized Quiz States
  // ==========================================
  // These states manage the adaptive/personalized quiz flow.
  const [personalizedQuestions, setPersonalizedQuestions] = useState([]);
  const [personalIndex, setPersonalIndex] = useState(0);
  const [personalSelected, setPersonalSelected] = useState("");
  const [showPersonalizedQuiz, setShowPersonalizedQuiz] = useState(false);
  const [personalAnswers, setPersonalAnswers] = useState([]); // store selections for topic generation
  const [showGenerateTopicButton, setShowGenerateTopicButton] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState([]);

  // Get Clerk user for personalization hints (kept optional)
  const { user } = useUser();

  // General states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // HELPER: Parse MCQ text into structured questions
  // ==========================================
  const parseQuestionsFromText = (text) => {
    const questions = [];
    if (!text || typeof text !== "string") return [];
    
    // Split by MCQ section header and extract MCQ section
    const sections = text.split(/\*\*Multiple-Choice Questions\*\*|\*\*Multiple Choice Questions\*\*/i);
    const mcqSection = sections.length > 1 ? sections[1] : text;
    
    // Split questions by numbered pattern (1., 2., 3., etc.)
    const questionBlocks = mcqSection.split(/\n(?=\d+\.)/);
    
    for (const block of questionBlocks) {
      const lines = block.trim().split("\n").filter(l => l.trim());
      if (lines.length < 4) continue;
      
      // Extract question text (first line, remove number)
      let questionText = lines[0].replace(/^\d+\.\s*/, "").trim();
      // Remove URL artifacts if present
      questionText = questionText.replace(/http[s]?:\/\/\S+/g, "").trim();
      
      // Extract options (lines with A), B), C), D))
      const options = [];
      let correctAnswer = null;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match option pattern: A) or A. at start of line
        const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)(?:\s*\*?Correct Answer:\*?.*)?$/i);
        if (optionMatch) {
          // optionMatch[1] contains the option letter (A, B, C, D)
          let optionText = optionMatch[2].trim();
          
          // Clean up option text
          optionText = optionText.replace(/\*?Correct Answer:\*?\s*[A-D]?\s*$/i, "").trim();
          
          if (optionText && optionText.length > 0) {
            options.push(optionText);
          }
          
          // Check if this line contains the correct answer marker
          if (line.match(/\*?Correct Answer:\*?\s*([A-D])/i)) {
            const match = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);
            correctAnswer = match[1];
          }
        }
      }
      
      // Ensure we have at least 3 options and a valid question
      if (questionText && options.length >= 3) {
        // If we have more than 4, trim to 4
        const finalOptions = options.slice(0, 4);
        
        let answerIndex = 0;
        if (correctAnswer) {
          answerIndex = correctAnswer.charCodeAt(0) - 65;
          // Ensure answerIndex is valid
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


  // ==========================================
  // STEP 1: EXTRACT DOCUMENT FROM GITHUB PDF
  // ==========================================
  // This function:
  // 1. Fetches PDF from GitHub
  // 2. Extracts text content
  // 3. Shows success message
  // 4. Stores extracted content for next step
  
  const extractDocument = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!githubLink.trim()) {
        setError("Please paste a GitHub PDF link");
        setLoading(false);
        return;
      }

      // Step 1a: Extract PDF content from GitHub
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

      // Step 1b: Store extracted content
      setExtractedContent(data.text);
      setIsExtracted(true);
      
      // Show success message
      setSuccessMessage("✅ PDF extracted successfully!");
      
      // Clear the message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error(err);
      setError("Document extraction failed. Make sure the PDF link is correct.");
    }

    setLoading(false);
  };

    // =========================================
    // STEP 5: Generate Personalized Quiz
    // NEW: This creates an adaptive quiz focused on LEARNING STYLE PREFERENCES,
    // NOT on the entered topic. It assesses how the user prefers to learn.
    // It does NOT show a result screen after completion per requirements.
    // =========================================
    const generatePersonalizedQuiz = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const profile = user ? { id: user.id, fullName: user.fullName, primaryEmail: user.primaryEmailAddress?.emailAddress || null } : {};

        // IMPORTANT: Personalized quiz focuses on learning preferences, NOT topic-based questions
        const payload = {
          // Do NOT include topic or docText - only ask about learning style
          userProfile: profile
        };

        const res = await fetch("http://localhost:5000/personalized-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server ${res.status}: ${txt}`);
        }

        const data = await res.json();

        // Expecting JSON array of questions
        if (Array.isArray(data) && data.length > 0) {
          setPersonalizedQuestions(data);
          setPersonalIndex(0);
          setPersonalSelected("");
          setPersonalAnswers([]);
          setShowPersonalizedQuiz(true);
          setShowGenerateTopicButton(false);
        } else {
          setError("Learning preference assessment returned no questions");
        }

      } catch (err) {
        console.error("Personalized generation error:", err);
        setError(`Learning assessment failed: ${err.message}`);
      }

      setLoading(false);
    };

    // =========================================
    // Personalized Quiz: Next Question
    // Advances through the learning preference questions and records answers.
    // When finished, DO NOT show a result; instead show the 'Generate Content' button.
    // =========================================
    const nextPersonalQuestion = () => {
      // record answer
      setPersonalAnswers(prev => [...prev, personalSelected]);

      setPersonalSelected("");

      if (personalIndex + 1 < personalizedQuestions.length) {
        setPersonalIndex(personalIndex + 1);
      } else {
        // Finished personalized quiz: do NOT show result, show success message
        setShowPersonalizedQuiz(false);
        setSuccessMessage("✅ Personalized assessment completed!");
        setTimeout(() => setSuccessMessage(""), 3000);
        // Now show the Generate Content button
        setShowGenerateTopicButton(true);
      }
    };

    // =========================================
    // Generate Content (Topics) based on learning preferences and profile
    // =========================================
    const generateTopic = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const payload = { lastAnswers: personalAnswers, userProfile: user ? { id: user.id, fullName: user.fullName } : {} };
        const res = await fetch("http://localhost:5000/generate-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server ${res.status}: ${txt}`);
        }

        const data = await res.json();
        if (data && Array.isArray(data.topics)) {
          setGeneratedTopics(data.topics);
          setShowGenerateTopicButton(false);
          setSuccessMessage("✅ Content generated successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setError("Content generation returned unexpected format");
        }

      } catch (err) {
        console.error("Content generation error:", err);
        setError(`Content generation failed: ${err.message}`);
      }

      setLoading(false);
    };


  // =========================================
  // STEP 2: GENERATE QUESTIONS FROM CONTENT
  // =========================================
  // This function:
  // 1. Accepts extracted content or topic as input
  // 2. Calls backend to generate MCQs
  // 3. Parses and displays questions
  // 4. Resets quiz state (index=0, score=0)

  const generateQuiz = async (useExtractedContent = true) => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let res;
      let payload = {};

      // Option 1: Generate from extracted document content
      if (useExtractedContent && extractedContent) {
        console.log("🚀 Generating quiz from extracted content, length:", extractedContent.length);
        payload = { docText: extractedContent };
        res = await fetch("http://localhost:5000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      // Option 2: Generate from user-entered topic
      else if (topic.trim()) {
        console.log("🚀 Generating quiz from topic:", topic);
        payload = { topic: topic };
        res = await fetch("http://localhost:5000/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      else {
        setError("Please extract a PDF first or enter a topic");
        setLoading(false);
        return;
      }

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.text();
        console.error("❌ Server error:", errorData);
        setError(`Server error: ${res.status} - ${errorData}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("📨 Response data:", data);

      let parsedQuestions = [];

      if (Array.isArray(data)) {
        // NEW: Gemini returns JSON array directly
        console.log("✅ Direct JSON format detected, count:", data.length);
        parsedQuestions = data.map(q => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [q.options],
          answer: q.answer || q.options[0]
        }));
      } else if (data.questions) {
        // OLD: Handle nested response structure: {questions: {questions: "..."}}
        let questionsText = typeof data.questions === 'object' ? data.questions.questions : data.questions;
        
        console.log("📝 Questions text length:", questionsText ? questionsText.length : 0);
        
        // Try to parse as JSON first
        try {
          const jsonParsed = JSON.parse(questionsText);
          if (Array.isArray(jsonParsed)) {
            console.log("✅ JSON array detected from text");
            parsedQuestions = jsonParsed.map(q => ({
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [q.options],
              answer: q.answer || q.options[0]
            }));
          } else {
            throw new Error("Not an array");
          }
        } catch (e) {
          console.log("📄 Parsing as text format");
          parsedQuestions = parseQuestionsFromText(questionsText);
        }
      } else if (data.error) {
        console.error("❌ API Error:", data.error);
        setError(`API Error: ${data.error}`);
        setLoading(false);
        return;
      } else {
        console.error("❌ Unknown response format:", data);
        setError("Unexpected response format from server");
        setLoading(false);
        return;
      }

      console.log("✅ Parsed questions count:", parsedQuestions.length);

      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        setIndex(0);
        setScore(0);
        setSelected("");
        setShowResult(false);
        setShowTopicInput(false);
        setSuccessMessage("✅ Questions generated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        console.log("🎉 Quiz ready with", parsedQuestions.length, "questions");
      } else {
        console.error("❌ Failed to parse any questions");
        setError("Could not parse questions. Please try again.");
      }

    } catch (err) {
      console.error("💥 Error:", err);
      setError(`Error: ${err.message}`);
    }

    setLoading(false);
  };


  // ==========================
  // Next Question
  // ==========================

  const nextQuestion = () => {

    if (selected === questions[index].answer) {
      setScore(score + 1);
    }

    setSelected("");

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    }
    else {
      // Quiz completed - show success message
      setSuccessMessage("✅ Quiz completed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowResult(true);
    }
  };


  // ==========================
  // UI
  // ==========================

  return (

    <div className="container">

      {/* Logged Out */}

      <SignedOut>

        <div className="login-box">
          <h2>Login to Continue</h2>
          <SignIn />
        </div>

      </SignedOut>


      {/* Logged In */}

      <SignedIn>

        {/* Top Bar */}

        <div className="top-bar">

          <h2>MCQ Generator</h2>
          <UserButton />

        </div>


        {/* Header */}

        <div className="header">
          <h1>Personalized Learning Platform</h1>
        </div>


        {/* ============================= */}
        {/* EXTRACTION STEP */}
        {/* ============================= */}

        {!isExtracted && (
          <div className="card">
            <h3>📄 Upload & Extract PDF</h3>

            <input
              type="text"
              placeholder="Paste GitHub PDF link"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />

            <button
              onClick={extractDocument}
              disabled={loading}
              style={{ 
                padding: "10px 20px", 
                backgroundColor: "#4CAF50", 
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Extracting..." : "Extract Document"}
            </button>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
          </div>
        )}

        {/* Success Message After Extraction */}
        {successMessage && (
          <div className="card" style={{ backgroundColor: "#d4edda", border: "1px solid #c3e6cb" }}>
            <p style={{ color: "#155724", margin: "10px 0" }}>{successMessage}</p>
          </div>
        )}


        {/* ============================= */}
        {/* EXTRACTED CONTENT PREVIEW */}
        {/* ============================= */}

        {isExtracted && !questions.length && !showTopicInput && (
          <div className="card">
            <h3>✅ PDF Content Extracted</h3>
            <textarea
              rows="6"
              value={extractedContent.substring(0, 500) + "..."}
              readOnly
              style={{ width: "100%", padding: "10px" }}
            />

            <button
              onClick={() => generateQuiz(true)}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "10px"
              }}
            >
              {loading ? "Generating..." : "📚 Start Quiz from PDF"}
            </button>

            <button
              onClick={() => {
                setGithubLink("");
                setExtractedContent("");
                setIsExtracted(false);
                setError("");
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#757575",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px",
                marginLeft: "10px"
              }}
            >
              ← Back
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* QUIZ STEP */}
        {/* ============================= */}

        {questions.length > 0 && !showResult && (
          <div className="card">
            <h3>
              🎯 Quiz ({index + 1}/{questions.length})
            </h3>
            <p style={{ fontSize: "18px", marginBottom: "15px" }}>
              {questions[index].question}
            </p>

            {questions[index].options.map((opt, i) => (
              <label key={i} className="option" style={{ display: "block", marginBottom: "10px" }}>
                <input
                  type="radio"
                  name="option"
                  value={opt}
                  checked={selected === opt}
                  onChange={(e) => setSelected(e.target.value)}
                />
                <span style={{ marginLeft: "10px" }}>{opt}</span>
              </label>
            ))}

            <button
              onClick={nextQuestion}
              disabled={!selected}
              style={{
                padding: "10px 20px",
                backgroundColor: selected ? "#FF9800" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: selected ? "pointer" : "not-allowed",
                marginTop: "15px"
              }}
            >
              Next Question
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* QUIZ RESULT & TOPIC INPUT */}
        {/* ============================= */}

        {showResult && !showTopicInput && (
          <div className="card">
            <h2>🏆 Quiz Complete</h2>
            <p className="result" style={{ fontSize: "24px", fontWeight: "bold", margin: "20px 0" }}>
              Your Score: {score} / {questions.length}
            </p>
            <p style={{ color: "#666" }}>
              Percentage: {Math.round((score / questions.length) * 100)}%
            </p>

            <button
              onClick={() => setShowTopicInput(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "15px"
              }}
            >
              📖 Explore Learning Preferences
            </button>

            <button
              onClick={() => {
                // Reset all states for a new session
                setQuestions([]);
                setIndex(0);
                setScore(0);
                setSelected({});
                setShowResult(false);
                setTopic("");
                setExtractedContent("");
                setIsExtracted(false);
                setGithubLink("");
                setError("");
                setSuccessMessage("");
                setPersonalizedQuestions([]);
                setPersonalIndex(0);
                setPersonalSelected("");
                setShowPersonalizedQuiz(false);
                setPersonalAnswers([]);
                setShowGenerateTopicButton(false);
                setGeneratedTopics([]);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#607D8B",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px",
                marginLeft: "10px"
              }}
            >
              🔄 New Session
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* LEARNING PREFERENCES STEP */}
        {/* After PDF quiz: User enters topic, then takes personalized quiz */}
        {/* to understand their learning preferences */}
        {/* ============================= */}

        {showTopicInput && (
          <div className="card">
            <h3>📌 Learning Preferences Assessment</h3>
            <p>Understanding your learning style will help us personalize your experience.</p>

            <input
              type="text"
              placeholder="Enter a topic to explore (optional)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "16px"
              }}
            />

            {/* CHANGED: Removed "Generate Quiz" button per requirements */}
            {/* CHANGED: Keep only "Take Personalized Quiz" button active */}
            <button
              onClick={generatePersonalizedQuiz}
              disabled={loading || !topic.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: topic.trim() ? "#00695C" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: topic.trim() ? "pointer" : "not-allowed"
              }}
            >
              {loading ? "Preparing..." : "🧭 Start Learning Assessment"}
            </button>

            <button
              onClick={() => {
                setShowTopicInput(false);
                setShowResult(true);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#757575",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "10px"
              }}
            >
              ← Back
            </button>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
          </div>
        )}


        {/* ============================= */}
        {/* LEARNING ASSESSMENT QUIZ */}
        {/* Asks learning-style preferences, NOT topic-based questions */}
        {/* No score or result shown - just collecting user preferences */}
        {/* ============================= */}
        {showPersonalizedQuiz && (
          <div className="card">
            <h3>🧭 Learning Assessment ({personalIndex + 1}/{personalizedQuestions.length})</h3>
            <p style={{ fontSize: "18px", marginBottom: "15px" }}>{personalizedQuestions[personalIndex].question}</p>

            {personalizedQuestions[personalIndex].options.map((opt, i) => (
              <label key={i} className="option" style={{ display: "block", marginBottom: "10px" }}>
                <input
                  type="radio"
                  name="personalOption"
                  value={opt}
                  checked={personalSelected === opt}
                  onChange={(e) => setPersonalSelected(e.target.value)}
                />
                <span style={{ marginLeft: "10px" }}>{opt}</span>
              </label>
            ))}

            <button
              onClick={nextPersonalQuestion}
              disabled={!personalSelected}
              style={{
                padding: "10px 20px",
                backgroundColor: personalSelected ? "#FF5722" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: personalSelected ? "pointer" : "not-allowed",
                marginTop: "15px"
              }}
            >
              Next
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* CONTENT GENERATION STEP */}
        {/* Shows after learning assessment completes (NO score shown) */}
        {/* User can generate personalized content recommendations */}
        {/* ============================= */}
        {showGenerateTopicButton && (
          <div className="card">
            <h3>📚 Generate Personalized Content</h3>
            <p>Based on your learning preferences, here are recommended topics:</p>

            <button
              onClick={generateTopic}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3F51B5",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Generating..." : "✨ Generate Content"}
            </button>

            {generatedTopics.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <h4>📖 Recommended Topics for You</h4>
                <ul>
                  {generatedTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setShowGenerateTopicButton(false);
                setShowTopicInput(true);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#757575",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "15px"
              }}
            >
              ← Back
            </button>
          </div>
        )}


      </SignedIn>

    </div>
  );
}

export default App;
