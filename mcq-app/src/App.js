import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton
} from "@clerk/clerk-react";
import { useState } from "react";
import "./App.css";

function App() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // Fetch MCQs
  const generateQuiz = async () => {

  if (!topic.trim()) return;

  setLoading(true);
  setError("");

  try {

    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No questions");
    }

    setQuestions(data);
    setIndex(0);
    setScore(0);
    setShowResult(false);

  } catch (err) {

    console.error(err);
    setError("Failed to generate quiz. Please try again.");

  } finally {

    setLoading(false);

  }
};


  // Next button
  const nextQuestion = () => {
    if (selected === questions[index].answer) {
      setScore(score + 1);
    }

    setSelected("");

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setShowResult(true);
    }
  };

return (
  <div className="container">

    {/* When User is Logged Out */}
    <SignedOut>
      <div className="login-box">
        <h2>Login to Continue</h2>
        <SignIn />
      </div>
    </SignedOut>

    {/* When User is Logged In */}
    <SignedIn>

      <div className="top-bar">
        <h2>MCQ Generator</h2>
        <UserButton />
      </div>

      <div className="header">
        <h1>MCQ Generator</h1>
      </div>

      {/* Topic Input */}
      {questions.length === 0 && (
        <div className="start-box">
          <input
            type="text"
            placeholder="Enter topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <button onClick={generateQuiz} disabled={loading}>
            {loading ? "Generating..." : "Generate Quiz"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}

      {/* Quiz */}
      {questions.length > 0 && !showResult && (
        <div className="card">

          <h3>
            {index + 1}. {questions[index].question}
          </h3>

          {questions[index].options.map((opt, i) => (
            <label key={i} className="option">
              <input
                type="radio"
                name="option"
                value={opt}
                checked={selected === opt}
                onChange={(e) => setSelected(e.target.value)}
              />
              {opt}
            </label>
          ))}

          <button onClick={nextQuestion} disabled={!selected}>
            Next
          </button>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="card">

          <h2>Result</h2>

          <p className="result">
            Your Score: {score} / {questions.length}
          </p>

          <button
            onClick={() => {
              setQuestions([]);
              setIndex(0);
              setScore(0);
              setSelected("");
              setShowResult(false);
              setTopic("");
              setError("");
            }}
          >
            Restart
          </button>

        </div>
      )}

    </SignedIn>

  </div>
);

}

export default App;
