import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LearningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { topic } = location.state || { topic: "" };

  const [stage, setStage] = useState("input"); // "input", "questions", "content"
  const [topicInput, setTopicInput] = useState(topic);
  const [learningQuestions, setLearningQuestions] = useState([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningSelected, setLearningSelected] = useState("");
  const [learningAnswers, setLearningAnswers] = useState([]);
  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const generateLearningQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      if (!topicInput.trim()) {
        setError("Please enter a topic");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5000/generate-learning-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data) && data.length === 5) {
        setLearningQuestions(data);
        setLearningIndex(0);
        setLearningSelected("");
        setLearningAnswers([]);
        setStage("questions");
        setSuccessMessage("");
      } else {
        setError("Invalid learning questions format from server");
      }
    } catch (err) {
      console.error("Learning questions error:", err);
      setError(`Failed to load learning questions: ${err.message}`);
    }

    setLoading(false);
  };

  const nextLearningQuestion = async () => {
    if (!learningSelected) return;

    const currentQuestion = learningQuestions[learningIndex];
    const answerIndex = currentQuestion?.options?.indexOf(learningSelected) ?? 0;
    const nextAnswers = [...learningAnswers, answerIndex];
    setLearningAnswers(nextAnswers);
    setLearningSelected("");

    if (learningIndex + 1 < learningQuestions.length) {
      setLearningIndex(learningIndex + 1);
    } else {
      // Evaluate learning style
      evaluateLearningStyle(nextAnswers);
    }
  };

  const evaluateLearningStyle = async (answers) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/evaluate-learning-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answers,
          topic: topicInput
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        await generatePersonalizedContentForTopic(result.styleId);
      }
    } catch (err) {
      console.error("Learning style evaluation error:", err);
      setError(`Evaluation failed: ${err.message}`);
      setLoading(false);
    }
  };

  const generatePersonalizedContentForTopic = async (styleId) => {
    try {
      const res = await fetch("http://localhost:5000/generate-personalized-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput,
          styleId: styleId
        })
      });

      if (!res.ok) {
        throw new Error(`Server ${res.status}`);
      }

      const content = await res.json();
      setPersonalizedContent(content);
      setStage("content");
      setSuccessMessage("📚 Personalized learning path created for you!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Content generation error:", err);
      setError(`Content generation failed: ${err.message}`);
    }

    setLoading(false);
  };



  // Stage: Input topic
  if (stage === "input") {
    return (
      <div className="card">
        <h3>📌 Knowledge Level Assessment</h3>
        <p>Enter a topic to assess your knowledge level:</p>

        <input
          type="text"
          placeholder="Enter a topic (e.g., React, Python, Databases)"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "16px"
          }}
        />

        <button
          onClick={generateLearningQuestions}
          disabled={loading || !topicInput.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor: topicInput.trim() ? "#FF6F00" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: topicInput.trim() ? "pointer" : "not-allowed"
          }}
        >
          {loading ? "Preparing..." : "🎯 Begin Learning Assessment"}
        </button>

        <button
          onClick={() => navigate("/result")}
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
    );
  }

  // Stage: Learning preference questions
  if (stage === "questions" && learningQuestions.length > 0) {
    return (
      <div className="card">
        <h2>🎓 Learning Preference Assessment</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Question {learningIndex + 1} of {learningQuestions.length}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <h3>{learningQuestions[learningIndex]?.question}</h3>

          <div style={{ marginTop: "15px" }}>
            {learningQuestions[learningIndex]?.options?.map((option, idx) => (
              <label
                key={idx}
                style={{
                  display: "block",
                  marginBottom: "10px",
                  padding: "10px",
                  border: learningSelected === option ? "2px solid #2196F3" : "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: learningSelected === option ? "#E3F2FD" : "white",
                  cursor: "pointer"
                }}
              >
                <input
                  type="radio"
                  name="learning-option"
                  value={option}
                  checked={learningSelected === option}
                  onChange={(e) => setLearningSelected(e.target.value)}
                  style={{ marginRight: "10px" }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={nextLearningQuestion}
          disabled={!learningSelected}
          style={{
            padding: "10px 20px",
            backgroundColor: learningSelected ? "#2196F3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: learningSelected ? "pointer" : "not-allowed"
          }}
        >
          {learningIndex + 1 === learningQuestions.length ? "Complete Assessment" : "Next"}
        </button>

        {loading && <p style={{ marginTop: "10px", color: "#666" }}>Processing...</p>}
        {successMessage && <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>}
      </div>
    );
  }

  // Stage: Personalized content
  if (stage === "content" && personalizedContent) {
    return (
      <div className="card">
        <h2>📚 Your Personalized Learning Path</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Topic: <strong>{personalizedContent.topic}</strong>
        </p>

        <div style={{ marginBottom: "25px" }}>
          <h3>Suggested Learning Resources:</h3>
          <div style={{ marginTop: "15px" }}>
            {personalizedContent.resources?.map((resource, idx) => (
              <div
                key={idx}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "4px",
                  backgroundColor: "#FAFAFA"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 5px 0", fontWeight: "bold", fontSize: "16px" }}>
                      {resource.type}
                    </p>
                    <p style={{ margin: "0 0 5px 0", fontSize: "15px" }}>
                      {resource.title}
                    </p>
                    <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                      {resource.description}
                    </p>
                  </div>
                  <p style={{ margin: "0", color: "#999", fontSize: "13px", textAlign: "right", minWidth: "100px" }}>
                    ⏱ {resource.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3>📖 Recommended Learning Path:</h3>
          <ol style={{ marginTop: "10px", paddingLeft: "20px" }}>
            {personalizedContent.suggestedPath?.map((step, idx) => (
              <li key={idx} style={{ marginBottom: "8px", color: "#333" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3>💡 Learning Tips:</h3>
          <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
            {personalizedContent.tips?.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: "8px", color: "#333" }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => setStage("input")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          ✓ Understood
        </button>

        <button
          onClick={() => navigate("/result")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#757575",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Back
        </button>

        {successMessage && (
          <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>
        )}
      </div>
    );
  }

  return null;
}

export default LearningPage;

