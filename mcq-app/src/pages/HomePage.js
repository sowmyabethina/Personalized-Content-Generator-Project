import { useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const [githubLink, setGithubLink] = useState("");
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
    } catch (err) {
      console.error(err);
      setError("Document extraction failed. Make sure the PDF link is correct.");
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
        navigate("/quiz", {
          state: { questions: normalized, quizId: res.headers.get("X-Quiz-Id") }
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
    );
  }

  // Extracted content preview
  return (
    <div className="card">
      <h3>✅ PDF Content Extracted</h3>
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

      {successMessage && (
        <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>
      )}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default HomePage;
