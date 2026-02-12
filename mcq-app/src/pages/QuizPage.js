import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    questions,
    quizId,
    topic: initialTopic,

    // material learning flow
    fromMaterial,
    materialTopic,

    // resume / link analysis flow
    userId,
    sourceType,
    sourceUrl,
    extractedText,
    skills,
    strengths,
    weakAreas

  } = location.state || {
    questions: [],
    quizId: null,
    topic: "",
    fromMaterial: false,
    materialTopic: "",

    userId: null,
    sourceType: "resume",
    sourceUrl: null,
    extractedText: null,
    skills: [],
    strengths: [],
    weakAreas: []
  };

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
  const [correctCount, setCorrectCount] = useState(0);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState(false);

  // Learning questions state
  const [learningQuestions, setLearningQuestions] = useState([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningSelected, setLearningSelected] = useState("");
  const [learningSelectedScore, setLearningSelectedScore] = useState(0);
  const [learningAnswers, setLearningAnswers] = useState([]);

  // State for storing auto-generated questions
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState([]);

  // Use either questions from state or auto-generated questions
  const displayQuestions = questions && questions.length > 0 ? questions : generatedQuizQuestions;

  // Helper function to parse questions from text (same as in HomePage)
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
      let correctAnswerLetter = null;

      // First, check if the question line itself has the correct answer
      const questionLine = lines[0];
      const questionCorrectMatch = questionLine.match(/Correct Answer:\s*([A-D])/i);
      if (questionCorrectMatch) {
        correctAnswerLetter = questionCorrectMatch[1];
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line contains the correct answer marker
        const correctMatch = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);
        if (correctMatch) {
          correctAnswerLetter = correctMatch[1];
        }

        const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)$/i);
        if (optionMatch) {
          let optionText = optionMatch[2].trim();
          // Remove any "Correct Answer:" text from the option
          optionText = optionText.replace(/\*?Correct Answer:\*?\s*[A-D]?\s*/i, "").trim();

          if (optionText && optionText.length > 0) {
            options.push(optionText);
          }
        }
      }

      if (questionText && options.length >= 3) {
        const finalOptions = options.slice(0, 4);
        let answerIndex = 0;
        if (correctAnswerLetter) {
          answerIndex = correctAnswerLetter.toUpperCase().charCodeAt(0) - 65;
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

  // Load learning questions when entering learning stage
  useEffect(() => {
    if (stage === "learning") {
      loadLearningQuestions();
    }
  }, [stage]);

  // Auto-generate questions when navigated from HomePage with extractedText
  useEffect(() => {
    const autoGenerateQuestions = async () => {
      // Check if we have extractedText but no questions
      if ((!questions || questions.length === 0) && extractedText) {
        setLoading(true);
        setError("");

        try {
          const payload = {
            docText: extractedText.substring(0, 12000)
          };

          const res = await fetch("http://localhost:5000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            throw new Error(`Server ${res.status}`);
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
              }
            } catch (e) {
              // Fallback to text parsing
              parsedQuestions = parseQuestionsFromText(questionsText);
            }
          }

          if (parsedQuestions.length > 0) {
            // Normalize answers
            const normalized = parsedQuestions.map(q => {
              let correct = q.answer;
              // Convert letter answer (A, B, C, D) to actual answer text
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

            // Update state with generated questions
            setGeneratedQuizQuestions(normalized);
          } else {
            setError("Could not parse questions from extracted content.");
          }
        } catch (err) {
          console.error("Auto-generate error:", err);
          setError(`Error generating questions: ${err.message}`);
        }

        setLoading(false);
      }
    };

    autoGenerateQuestions();
  }, [extractedText, questions]);

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

  // Stage: Quiz Questions (from extracted PDF or auto-generated)
  if (stage === "quiz") {
    // Show loading when auto-generating questions
    if (!displayQuestions.length && (extractedText || localStorage.getItem("extractedContent"))) {
      return (
        <div className="card">
          <h2>📝 Technical Quiz</h2>
          <p style={{ marginBottom: "20px" }}>Generating questions from your document...</p>
          {loading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #667eea",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 15px"
              }}></div>
              <p>Please wait while we generate quiz questions from your uploaded document...</p>
            </div>
          )}
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(-10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      );
    }

    if (displayQuestions.length > 0) {
      const completeQuiz = async () => {
        try {
          const res = await fetch("http://localhost:5000/score-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId,
              answers: quizAnswers
            })
          });

          const data = await res.json();

          let correct = 0;
          if (data.error) {
            console.error("Scoring error:", data.error);
            // Fallback to client-side scoring
            quizAnswers.forEach((ans, i) => {
              const correctAnswer = displayQuestions[i]?.answer;
              if (ans === correctAnswer) correct++;
            });
          } else {
            correct = data.correct || 0;
          }
          const score = Math.round((correct / displayQuestions.length) * 100);
          setTechnicalScore(score);
          setCorrectCount(correct);
          localStorage.setItem("technicalScore", score.toString());
          setStage("score");
        } catch (err) {
          console.error("Failed to score quiz:", err);
          // Fallback to client-side scoring
          let correct = 0;
          quizAnswers.forEach((ans, i) => {
            const correctAnswer = displayQuestions[i]?.answer;
            if (ans === correctAnswer) correct++;
          });
          const score = Math.round((correct / displayQuestions.length) * 100);
          setTechnicalScore(score);
          setCorrectCount(correct);
          localStorage.setItem("technicalScore", score.toString());
          setStage("score");
        }
      };

      // Submit answer and show feedback
      const submitAnswer = () => {
        setQuizAnswerSubmitted(true);
      };

      // Move to next question after showing feedback
      const nextQuestion = () => {
        const nextAnswers = [...quizAnswers, quizSelected];
        setQuizAnswers(nextAnswers);
        setQuizSelected("");
        setQuizAnswerSubmitted(false);

        if (quizIndex + 1 < displayQuestions.length) {
          setQuizIndex(quizIndex + 1);
        } else {
          completeQuiz();
        }
      };

      return (
        <div className="card">
          <h2>📝 Technical Quiz (Based on Your PDF)</h2>
          <p>Question {quizIndex + 1} of {displayQuestions.length}</p>

          <h3 style={{ margin: "20px 0" }}>{displayQuestions[quizIndex]?.question}</h3>

          {displayQuestions[quizIndex]?.options.map((opt, i) => {
            const isCorrect = opt === displayQuestions[quizIndex]?.answer;
            const isSelected = quizSelected === opt;
            const showHighlight = quizSelected !== "";
            
            return (
              <label
                key={i}
                className="option"
                style={{
                  transition: "all 0.3s ease",
                  background: showHighlight
                    ? isCorrect
                      ? "#dcfce7"
                      : isSelected
                      ? "#fee2e2"
                      : "#f3f4f6"
                    : "",
                  borderColor: showHighlight
                    ? isCorrect
                      ? "#22c55e"
                      : isSelected
                      ? "#ef4444"
                      : "#d1d5db"
                    : "",
                  borderWidth: showHighlight ? "2px" : "1px",
                  cursor: "pointer"
                }}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={opt}
                  checked={quizSelected === opt}
                  onChange={(e) => setQuizSelected(e.target.value)}
                />
                <span style={{
                  color: showHighlight
                    ? isCorrect
                      ? "#16a34a"
                      : isSelected
                      ? "#dc2626"
                      : "inherit"
                    : "inherit",
                  fontWeight: isSelected ? "600" : "inherit"
                }}>
                  {opt}
                  {showHighlight && isCorrect && " ✓"}
                  {showHighlight && isSelected && !isCorrect && " ✗"}
                </span>
              </label>
            );
          })}

          <button onClick={nextQuestion} disabled={!quizSelected} style={{ marginTop: "15px" }}>
            {quizIndex + 1 < displayQuestions.length ? "Next →" : "Complete Quiz"}
          </button>

          <button
            onClick={() => {
              setQuizIndex(0);
              setQuizAnswers([]);
              setQuizSelected("");
              setQuizAnswerSubmitted(false);
              setStage("score");
            }}
            style={{ marginTop: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "12px 20px", width: "100%", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500" }}
          >
            ← back
          </button>
        </div>
      );
    }
  }

  // Stage: Show Score and Enter Topic
  if (stage === "score") {
    // If quiz came from learning material, show different UI
    if (fromMaterial) {
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
            <p style={{ fontSize: "14px", opacity: 0.9 }}>Your Quiz Score</p>
            <p style={{ fontSize: "48px", fontWeight: "bold", margin: "10px 0" }}>{technicalScore}%</p>
            <p style={{ fontSize: "14px", opacity: 0.9 }}>
              {correctCount}/{displayQuestions.length} correct
            </p>
          </div>

          <button
            onClick={() => {
              const storedMaterial = localStorage.getItem("learningMaterialData");
              const learningMaterial = storedMaterial ? JSON.parse(storedMaterial) : null;
              navigate("/learning-material", {
                state: {
                  learningMaterial: learningMaterial,
                  topic: materialTopic,
                  technicalLevel: technicalScore >= 80 ? "Advanced" : technicalScore >= 60 ? "Intermediate" : "Beginner",
                  learningScore: parseInt(localStorage.getItem("learningScore") || "50")
                }
              });
            }}
            style={{ width: "100%", padding: "14px", fontSize: "16px", marginBottom: "15px" }}
          >
            📚 Back to Learning Material
          </button>

          <button
            onClick={() => {
              setQuizIndex(0);
              setQuizAnswers([]);
              setQuizSelected("");
              setStage("quiz");
            }}
            style={{ marginTop: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "12px 20px", width: "100%", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500" }}
          >
            ← Retake Quiz
          </button>
        </div>
      );
    }

    // Original flow for quiz not from learning material
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
            {correctCount}/{displayQuestions.length} correct
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
          Continue to Learner Assessment →
        </button>

        <button
          onClick={() => {
            setQuizIndex(0);
            setQuizAnswers([]);
            setQuizSelected("");
            setStage("quiz");
          }}
          style={{ marginTop: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "12px 20px", width: "100%", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500" }}
        >
          ← back (Retake Quiz)
        </button>
      </div>
    );
  }

  // Helper function to analyze psychometric profile (must be defined before use)
  const analyzePsychometricProfile = (answers, questions) => {
    const levels = {};
    const categories = ["technicalFamiliarity", "documentationSkill", "learningGoal", "applicationConfidence", "learningBehavior"];

    answers.forEach((score, idx) => {
      const category = categories[idx];
      if (score === 0) levels[category] = "Beginner";
      else if (score === 1) levels[category] = "Intermediate";
      else levels[category] = "Advanced";
    });

    // Calculate overall level
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const maxScore = answers.length * 2;
    const percentage = (totalScore / maxScore) * 100;

    let overallLevel = "Beginner";
    if (percentage >= 70) overallLevel = "Advanced";
    else if (percentage >= 35) overallLevel = "Intermediate";

    return { levels, overallLevel };
  };

  // Stage: Learner Level Assessment
  if (stage === "learning") {
    if (loading && learningQuestions.length === 0) {
      return (
        <div className="card">
          <h2>📊 Loading Learner Level Assessment...</h2>
        </div>
      );
    }

    if (learningQuestions.length === 0) {
      return (
        <div className="card">
          <h2>📊 Learner Level Assessment</h2>
          <p style={{ marginBottom: "20px" }}>This diagnostic test measures your technical proficiency across multiple dimensions.</p>

          {/* Back Button */}
          <button
            onClick={() => {
              setLearningIndex(0);
              setLearningAnswers([]);
              setLearningSelected("");
              setStage("score");
            }}
            style={{ marginBottom: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500", marginRight: "10px" }}
          >
            ← Back
          </button>

          <button onClick={loadLearningQuestions} disabled={loading} style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "600" }}>
            {loading ? "Loading..." : "Start Assessment →"}
          </button>
        </div>
      );
    }

    const completeLearningAssessment = async () => {
      // Calculate psychometric score (0-100 scale)
      // Each question has 3 options: Beginner (0), Intermediate (1), Advanced (2)
      const totalPoints = learningAnswers.reduce((acc, val) => acc + val, 0);
      const maxPoints = learningQuestions.length * 2;
      const learnScore = Math.round((totalPoints / maxPoints) * 100);

      localStorage.setItem("learningScore", learnScore.toString());

      const techScore = parseInt(localStorage.getItem("technicalScore") || "50");
      const storedTopic = localStorage.getItem("quizTopic") || topic;
      const techLevel = techScore >= 80 ? "Advanced" : techScore >= 60 ? "Intermediate" : "Beginner";

      // Analyze psychometric profile
      const profile = analyzePsychometricProfile(learningAnswers, learningQuestions);

      // Save/update analysis in database
      let analysisId = localStorage.getItem("currentAnalysisId");

      if (!analysisId) {
        // Create new analysis if none exists
        try {
          const saveRes = await fetch("http://localhost:5000/save-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: null,
              sourceType: location.state?.sourceType || "resume",
              sourceUrl: location.state?.sourceUrl || null,
              extractedText: location.state?.extractedText || null,
              skills: [],
              strengths: [],
              weakAreas: [],
              technicalLevel: techLevel,
              learningStyle: profile.overallLevel,
              overallScore: techScore,
              topic: storedTopic,
              learningScore: learnScore,
              technicalScore: techScore,
              psychometricProfile: profile.levels
            })
          });

          if (saveRes.ok) {
            const saveData = await saveRes.json();
            analysisId = saveData.analysisId;
            localStorage.setItem("currentAnalysisId", analysisId);
            console.log("✅ Analysis created:", analysisId);
          }
        } catch (saveErr) {
          console.error("Failed to create analysis:", saveErr);
        }
      } else {
        // Update existing analysis
        try {
          await fetch(`http://localhost:5000/analysis/${analysisId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              learningStyle: profile.overallLevel,
              topic: storedTopic,
              learningScore: learnScore,
              technicalScore: techScore,
              psychometricProfile: profile.levels
            })
          });
          console.log("✅ Analysis updated with learner assessment data");
        } catch (updateErr) {
          console.error("Failed to update analysis:", updateErr);
        }
      }

      // Store combined data and navigate to options
      localStorage.setItem("combinedData", JSON.stringify({
        technicalLevel: techLevel,
        technicalScore: techScore,
        learnerLevel: profile.overallLevel,
        learningScore: learnScore,
        psychometricProfile: profile.levels,
        combinedAnalysis: `Technical: ${techLevel} (${techScore}%), Learner: ${profile.overallLevel} (${learnScore}%)`
      }));

      setStage("options");
    };

    const nextQuestion = () => {
      const nextAnswers = [...learningAnswers, learningSelectedScore];
      setLearningAnswers(nextAnswers);
      setLearningSelected("");
      setLearningSelectedScore(0);

      if (learningIndex + 1 < learningQuestions.length) {
        setLearningIndex(learningIndex + 1);
      } else {
        completeLearningAssessment();
      }
    };

    const handleOptionChange = (option, index) => {
      setLearningSelected(option);
      setLearningSelectedScore(index); // 0 = Beginner, 1 = Intermediate, 2 = Advanced
    };

    return (
      <div className="card">
        <h2>📊 Learner Level Assessment</h2>
        <p>Question {learningIndex + 1} of {learningQuestions.length}</p>

        <h3 style={{ margin: "20px 0" }}>{learningQuestions[learningIndex]?.question}</h3>

        {learningQuestions[learningIndex]?.options.map((opt, i) => (
          <label key={i} className="option">
            <input
              type="radio"
              name="learning-option"
              value={opt}
              checked={learningSelected === opt}
              onChange={(e) => handleOptionChange(opt, i)}
            />
            <span>{opt}</span>
          </label>
        ))}

        <button onClick={nextQuestion} disabled={!learningSelected} style={{ marginTop: "15px" }}>
          {learningIndex + 1 < learningQuestions.length ? "Next →" : "Complete Assessment"}
        </button>

        <button
          onClick={() => {
            setLearningIndex(0);
            setLearningAnswers([]);
            setLearningSelected("");
            setStage("score");
          }}
          style={{ marginTop: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "12px 20px", width: "100%", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500" }}
        >
          ← Back to Quiz Score
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
    const psychometricProfile = storedCombined.psychometricProfile || {};

    const techLevel = techScore >= 80 ? "Advanced" : techScore >= 60 ? "Intermediate" : "Beginner";
    const learnerLevel = storedCombined.learnerLevel || "Beginner";

    // Helper to get level badge color
    const getLevelColor = (level) => {
      if (level === "Advanced") return "#10b981";
      if (level === "Intermediate") return "#f59e0b";
      return "#ef4444";
    };

    // Format category name for display
    const formatCategory = (key) => {
      return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
    };

    return (
      <div className="card">
        <h2>🚀 Step 4: Generate Your Content</h2>

        {/* Back Button */}
        <button
          onClick={() => {
            setLearningIndex(0);
            setLearningAnswers([]);
            setLearningSelected("");
            setStage("learning");
          }}
          style={{ marginBottom: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", color: "#374151", fontSize: "14px", fontWeight: "500" }}
        >
          ← Back to Learning Assessment
        </button>

        {/* Assessment Summary */}
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "10px", margin: "20px 0", textAlign: "left" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>📊 Your Assessment Profile:</h4>
          <p>Technical Level: <strong>{techLevel}</strong> ({techScore}%)</p>
          <p>Learner Level: <strong>{learnerLevel}</strong> ({learnScore}%)</p>
          <p>Topic: <strong>{storedTopic}</strong></p>

          <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
          <h5 style={{ margin: "0 0 10px 0" }}>Psychometric Assessment:</h5>

          {Object.entries(psychometricProfile).map(([key, value]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "14px" }}>
              <span>{formatCategory(key)}:</span>
              <span style={{
                color: getLevelColor(value),
                fontWeight: "bold"
              }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Continue to Content Generation */}
        <button
          onClick={() => navigate("/result", {
            state: {
              topic: storedTopic,
              technicalScore: techScore,
              learningScore: learnScore,
              combinedAnalysis: storedCombined,
              mode: "direct",
              // Pass through analysis data from HomePage
              userId,
              sourceType,
              sourceUrl,
              extractedText,
              skills,
              strengths,
              weakAreas
            }
          })}
          style={{ padding: "20px", fontSize: "16px", width: "100%" }}
        >
          <span style={{ fontSize: "30px" }}>⚡</span>
          <strong>Continue to Content Generation</strong>
        </button>

        <button
          onClick={() => navigate("/pdf-chat")}
          style={{ marginTop: "15px", background: "transparent", border: "1px solid #ddd", padding: "12px", width: "100%" }}
        >
          📄 Chat with PDF Instead
        </button>
      </div>
    );
  }

  // Fallback - no questions and not loading
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
