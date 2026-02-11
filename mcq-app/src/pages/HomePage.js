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
      // Priority: Resume PDF over GitHub URL
      if (inputType === "resume") {
        // Resume PDF upload path
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
        setSuccessMessage("✅ Resume PDF extracted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

      } else {
        // GitHub URL path (existing logic)
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
        setSuccessMessage("✅ PDF extracted successfully!");
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
    // Client-side guard: ensure there's enough extracted content
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
        console.error("❌ Server error:", res.status, bodyText);

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

        setSuccessMessage("✅ Questions generated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        // Navigate to quiz page with questions
        // Analysis will be saved after content generation in ResultPage
        // to avoid duplicate/empty inserts
        navigate("/quiz", {
          state: { 
            questions: normalized, 
            quizId: res.headers.get("X-Quiz-Id"),
            // Pass analysis data for saving later
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
      console.error("💥 Error:", err);
      setError(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  // Extraction step
  if (!isExtracted) {
    return (
      <div className="card">
        <h3>📄 Upload & Extract Document</h3>
        
        {/* Input Type Toggle */}
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "20px",
          justifyContent: "center"
        }}>
          <button
            onClick={() => {
              setInputType("github");
              setResumeFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: inputType === "github" ? "#2563eb" : "#e5e7eb",
              color: inputType === "github" ? "white" : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            GitHub URL
          </button>
          <button
            onClick={() => {
              setInputType("resume");
              setGithubLink("");
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: inputType === "resume" ? "#2563eb" : "#e5e7eb",
              color: inputType === "resume" ? "white" : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Upload Resume
          </button>
        </div>
        
        {inputType === "github" ? (
          <>
            <input
              type="text"
              placeholder="Paste GitHub PDF link"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
          </>
        ) : (
          <>
            <input
              type="file"
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
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            {resumeFile && (
              <p style={{ color: "green", marginBottom: "10px" }}>
                ✅ Selected: {resumeFile.name}
              </p>
            )}
          </>
        )}

        <button
          onClick={extractDocument}
          disabled={loading || (inputType === "resume" && !resumeFile) || (inputType === "github" && !githubLink.trim())}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#9ca3af" : "#4CAF50",
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
    );
  }

  // Extracted content preview
  return (
    <div className="card">
      <h3>✅ Content Extracted</h3>
      <p style={{ color: "#6b7280", marginBottom: "10px" }}>
        Source: {inputType === "resume" ? "Resume PDF" : "GitHub PDF"}
      </p>
      <textarea
        rows="6"
        value={extractedContent.substring(0, 500) + "..."}
        readOnly
        style={{ width: "100%", padding: "10px" }}
      />

      <button
        onClick={generateQuiz}
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
        {loading ? "Generating..." : "📚 Start Quiz"}
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

      {successMessage && (
        <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>
      )}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default HomePage;
