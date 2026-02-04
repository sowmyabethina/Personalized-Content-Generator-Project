import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton
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
      // Store extraction success indicator in state
      
      // Show success message
      setSuccessMessage("✅ Data extracted successfully!");
      
      // Clear the message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err) {
      console.error(err);
      setError("Document extraction failed. Make sure the PDF link is correct.");
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
        {/* STEP 1: EXTRACT DOCUMENT */}
        {/* ============================= */}

        {!isExtracted && (
          <div className="card">
            <h3>📄 Step 1: Upload & Extract PDF</h3>

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
        {/* STEP 1b: SHOW EXTRACTED CONTENT */}
        {/* ============================= */}

        {isExtracted && !questions.length && !showTopicInput && (
          <div className="card">
            <h3>✅ Extracted Content Preview</h3>
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
              {loading ? "Generating..." : "📚 Proceed to Quiz (Generate from Extracted Content)"}
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* STEP 2: QUIZ */}
        {/* ============================= */}

        {questions.length > 0 && !showResult && (
          <div className="card">
            <h3>
              🎯 Step 2: Quiz ({index + 1}/{questions.length})
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
        {/* STEP 3: RESULT & TOPIC INPUT */}
        {/* ============================= */}

        {showResult && !showTopicInput && (
          <div className="card">
            <h2>🏆 Quiz Result</h2>
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
              📖 Generate New Quiz from Topic
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setIndex(0);
                setScore(0);
                setSelected({});
                setShowResult(false);
                setTopic("");
                setExtractedContent("");
                setIsExtracted(false);
                // setExtractionSuccess(false);  // Commented out - state not used
                // setPdfFile(null);  // Commented out - state not used
                setGithubLink("");
                setError("");
                setSuccessMessage("");
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
              ↻ Start Over
            </button>
          </div>
        )}


        {/* ============================= */}
        {/* STEP 3b: TOPIC INPUT SCREEN */}
        {/* ============================= */}

        {showTopicInput && (
          <div className="card">
            <h3>📌 Step 3: Generate Quiz from Topic</h3>
            <p>Enter a topic to generate new questions:</p>

            <input
              type="text"
              placeholder="Enter topic (e.g., JavaScript, Biology, History)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "16px"
              }}
            />

            <button
              onClick={() => generateQuiz(false)}
              disabled={loading || !topic.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: topic.trim() ? "#4CAF50" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: topic.trim() ? "pointer" : "not-allowed"
              }}
            >
              {loading ? "Generating..." : "🎓 Generate Quiz"}
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
              Back to Result
            </button>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
          </div>
        )}


      </SignedIn>

    </div>
  );
}

export default App;
