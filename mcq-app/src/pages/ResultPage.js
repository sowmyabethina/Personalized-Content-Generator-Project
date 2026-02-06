import { useNavigate, useLocation } from "react-router-dom";

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { score, correctCount, questions } = location.state || {
    score: 0,
    correctCount: 0,
    questions: []
  };

  return (
    <div className="card">
      <h2>🏆 Quiz Complete</h2>
      <p className="result" style={{ fontSize: "24px", fontWeight: "bold", margin: "20px 0" }}>
        Your Score: {correctCount !== null ? correctCount : 0} / {questions.length || 0}
      </p>
      <p style={{ color: "#666" }}>Percentage: {score}%</p>

      <button
        onClick={() => navigate("/assessment")}
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
        📖 Assess Your Knowledge Level
      </button>

      <button
        onClick={() => navigate("/")}
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
  );
}

export default ResultPage;
