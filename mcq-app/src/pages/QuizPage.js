import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { questions, quizId } = location.state || { questions: [], quizId: null };

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const nextQuestion = async () => {
    if (!selected) return;

    const nextUserAnswers = [...userAnswers, selected];
    setUserAnswers(nextUserAnswers);
    setSelected("");

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      // Quiz completed - evaluate
      setSuccessMessage("✅ Quiz completed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setLoading(true);
      try {
        let score = 0;
        let correctCount = 0;

        if (quizId) {
          const resp = await fetch("http://localhost:5000/evaluate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizId, answers: nextUserAnswers })
          });

          if (resp.ok) {
            const result = await resp.json();
            if (result && result.success) {
              score = Number(result.score) || 0;
              correctCount = Number(result.correct) || 0;
            } else {
              correctCount = result.correct || 0;
              score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
            }
          } else {
            const clientCorrect = questions.reduce(
              (acc, q, i) =>
                acc +
                ((q.answer || "").toString().trim().toLowerCase() ===
                (nextUserAnswers[i] || "").toString().trim().toLowerCase()
                  ? 1
                  : 0),
              0
            );
            correctCount = clientCorrect;
            score = questions.length > 0 ? Math.round((clientCorrect / questions.length) * 100) : 0;
          }
        } else {
          const clientCorrect = questions.reduce(
            (acc, q, i) =>
              acc +
              ((q.answer || "").toString().trim().toLowerCase() ===
              (nextUserAnswers[i] || "").toString().trim().toLowerCase()
                ? 1
                : 0),
            0
          );
          correctCount = clientCorrect;
          score = questions.length > 0 ? Math.round((clientCorrect / questions.length) * 100) : 0;
        }

        // Navigate to result page with score data
        navigate("/result", {
          state: {
            score,
            correctCount,
            questions,
            userAnswers: nextUserAnswers
          }
        });
      } catch (err) {
        console.error("Evaluation error:", err);
        setError("Failed to evaluate quiz");
        setLoading(false);
      }
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="card">
        <h2>No questions available</h2>
        <p>Please go back and generate questions first.</p>
        <button onClick={() => navigate("/")} style={{ marginTop: "10px" }}>
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>🎯 Quiz ({index + 1}/{questions.length})</h3>
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
        disabled={!selected || loading}
        style={{
          padding: "10px 20px",
          backgroundColor: selected ? "#FF9800" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: selected && !loading ? "pointer" : "not-allowed",
          marginTop: "15px"
        }}
      >
        {loading ? "Evaluating..." : index + 1 < questions.length ? "Next Question" : "Submit Quiz"}
      </button>

      {successMessage && (
        <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>
      )}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default QuizPage;
