import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { questions, quizId, topic: initialTopic } = location.state || { questions: [], quizId: null, topic: "" };

  // All hooks at the top
  const [stage, setStage] = useState("quiz");
  const [topic, setTopic] = useState(initialTopic || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Technical quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState("");
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [technicalScore, setTechnicalScore] = useState(0);
  
  // Learning questions state
  const [learningQuestions, setLearningQuestions] = useState([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningSelected, setLearningSelected] = useState("");
  const [learningAnswers, setLearningAnswers] = useState([]);

  // Load learning questions when entering learning stage
  useEffect(() => {
    if (stage === "learning") {
      loadLearningQuestions();
    }
  }, [stage]);

  const loadLearningQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/generate-learning-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLearningQuestions(data);
        setLearningIndex(0);
        setLearningAnswers([]);
      }
    } catch (err) {
      console.error("Failed to load learning questions:", err);
    }
    setLoading(false);
  };

  // Stage: Quiz Questions (from extracted PDF)
  if (stage === "quiz" && questions && questions.length > 0) {
    const completeQuiz = async () => {
      let correct = 0;
      quizAnswers.forEach((ans, i) => {
        const correctAnswer = questions[i]?.answer;
        if (ans === correctAnswer) correct++;
      });
      const score = Math.round((correct / questions.length) * 100);
      setTechnicalScore(score);
      localStorage.setItem("technicalScore", score.toString());
      setStage("score");
    };

    const nextQuestion = () => {
      const nextAnswers = [...quizAnswers, quizSelected];
      setQuizAnswers(nextAnswers);
      setQuizSelected("");

      if (quizIndex + 1 < questions.length) {
        setQuizIndex(quizIndex + 1);
      } else {
        completeQuiz();
      }
    };

    return (
      <div className="card">
        <h2>📝 Technical Quiz (Based on Your PDF)</h2>
        <p>Question {quizIndex + 1} of {questions.length}</p>
        
        <h3 style={{ margin: "20px 0" }}>{questions[quizIndex]?.question}</h3>

        {questions[quizIndex]?.options.map((opt, i) => (
          <label key={i} className="option">
            <input
              type="radio"
              name="quiz-option"
              value={opt}
              checked={quizSelected === opt}
              onChange={(e) => setQuizSelected(e.target.value)}
            />
            <span>{opt}</span>
          </label>
        ))}

        <button onClick={nextQuestion} disabled={!quizSelected} style={{ marginTop: "15px" }}>
          {quizIndex + 1 < questions.length ? "Next →" : "Complete Quiz"}
        </button>
      </div>
    );
  }

  // Stage: Show Score and Enter Topic
  if (stage === "score") {
    return (
      <div className="card">
        <h2>📊 Quiz Complete!</h2>
        
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          padding: "30px",
          color: "white",
          marginBottom: "20px"
        }}>
          <p style={{ fontSize: "14px", opacity: 0.9 }}>Technical Score</p>
          <p style={{ fontSize: "48px", fontWeight: "bold", margin: "10px 0" }}>{technicalScore}%</p>
          <p style={{ fontSize: "14px", opacity: 0.9 }}>
            {quizAnswers.length}/{questions.length} correct
          </p>
        </div>

        <h3>Step 1: Enter Topic to Learn</h3>
        <input
          type="text"
          placeholder="What do you want to learn? (e.g., Python, React, AI)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ width: "100%", padding: "14px", fontSize: "16px", marginBottom: "15px" }}
        />
        
        <button
          onClick={() => {
            if (topic.trim()) {
              localStorage.setItem("quizTopic", topic);
              setStage("learning");
            }
          }}
          disabled={!topic.trim()}
          style={{ width: "100%", padding: "14px", fontSize: "16px" }}
        >
          Continue to Learning Preferences →
        </button>
      </div>
    );
  }

  // Stage: Learning Preferences
  if (stage === "learning") {
    if (loading && learningQuestions.length === 0) {
      return (
        <div className="card">
          <h2>📊 Loading Learning Questions...</h2>
        </div>
      );
    }

    if (learningQuestions.length === 0) {
      return (
        <div className="card">
          <h2>📊 Learning Preferences</h2>
          <button onClick={loadLearningQuestions} disabled={loading}>
            {loading ? "Loading..." : "Start Learning Assessment →"}
          </button>
        </div>
      );
    }

    const completeLearningAssessment = () => {
      const learnScore = learningAnswers.reduce((acc, val, idx) => acc + (val * 25), 0);
      localStorage.setItem("learningScore", learnScore.toString());
      
      const techScore = parseInt(localStorage.getItem("technicalScore") || "50");
      const storedTopic = localStorage.getItem("quizTopic") || topic;
      const techLevel = techScore >= 80 ? "Advanced" : techScore >= 60 ? "Intermediate" : "Beginner";
      const learnStyle = learnScore >= 60 ? "Hands-On" : learnScore >= 40 ? "Balanced" : "Theory-First";

      // Store combined data and navigate to options
      localStorage.setItem("combinedData", JSON.stringify({
        technicalLevel: techLevel,
        technicalScore: techScore,
        learningStyle: learnStyle,
        learningScore: learnScore,
        combinedAnalysis: `Technical: ${techLevel} (${techScore}%), Learning: ${learnStyle} (${learnScore}%)`
      }));
      
      setStage("options");
    };

    const nextQuestion = () => {
      const nextAnswers = [...learningAnswers, learningSelected];
      setLearningAnswers(nextAnswers);
      setLearningSelected("");

      if (learningIndex + 1 < learningQuestions.length) {
        setLearningIndex(learningIndex + 1);
      } else {
        completeLearningAssessment();
      }
    };

    return (
      <div className="card">
        <h2>📊 Learning Preferences</h2>
        <p>Question {learningIndex + 1} of {learningQuestions.length}</p>

        <h3 style={{ margin: "20px 0" }}>{learningQuestions[learningIndex]?.question}</h3>

        {learningQuestions[learningIndex]?.options.map((opt, i) => (
          <label key={i} className="option">
            <input
              type="radio"
              name="learning-option"
              value={opt}
              checked={learningSelected === opt}
              onChange={(e) => setLearningSelected(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}

        <button onClick={nextQuestion} disabled={!learningSelected} style={{ marginTop: "15px" }}>
          {learningIndex + 1 < learningQuestions.length ? "Next →" : "Complete Assessment"}
        </button>
      </div>
    );
  }

  // Stage: Two Options (PDF Chat or Direct Generation)
  if (stage === "options") {
    const techScore = parseInt(localStorage.getItem("technicalScore") || "50");
    const learnScore = parseInt(localStorage.getItem("learningScore") || "50");
    const storedTopic = localStorage.getItem("quizTopic") || topic;
    const storedCombined = JSON.parse(localStorage.getItem("combinedData") || "{}");

    const techLevel = techScore >= 80 ? "Advanced" : techScore >= 60 ? "Intermediate" : "Beginner";
    const learnStyle = learnScore >= 60 ? "Hands-On" : learnScore >= 40 ? "Balanced" : "Theory-First";

    return (
      <div className="card">
        <h2>🚀 Step 4: Generate Your Content</h2>
        
        {/* Assessment Summary */}
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "10px", margin: "20px 0", textAlign: "left" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>📊 Your Profile:</h4>
          <p>Technical Level: <strong>{techLevel}</strong> ({techScore}%)</p>
          <p>Learning Style: <strong>{learnStyle}</strong></p>
          <p>Topic: <strong>{storedTopic}</strong></p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/pdf-chat")}
            style={{ padding: "20px", fontSize: "16px", textAlign: "left", display: "flex", alignItems: "center", gap: "15px" }}
          >
            <span style={{ fontSize: "30px" }}>📄</span>
            <div>
              <strong>PDF Chat</strong>
              <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.8 }}>
                Chat with your PDF documents and get personalized help
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/result", {
              state: {
                topic: storedTopic,
                technicalScore: techScore,
                learningScore: learnScore,
                combinedData: storedCombined,
                mode: "direct"
              }
            })}
            style={{ padding: "20px", fontSize: "16px", textAlign: "left", display: "flex", alignItems: "center", gap: "15px" }}
          >
            <span style={{ fontSize: "30px" }}>⚡</span>
            <div>
              <strong>Direct Generation</strong>
              <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.8 }}>
                Get personalized content based on your profile
              </p>
            </div>
          </button>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{ marginTop: "20px", background: "#607D8B" }}
        >
          ← Start New Session
        </button>
      </div>
    );
  }

  // Fallback - no questions
  return (
    <div className="card">
      <h2>No questions available</h2>
      <p>Please go back and extract a PDF first.</p>
      <button onClick={() => navigate("/")} style={{ marginTop: "10px" }}>
        ← Back to Home
      </button>
    </div>
  );
}

export default QuizPage;
