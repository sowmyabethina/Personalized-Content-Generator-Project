import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    questions,
    quizId,
    topic: initialTopic,
    fromMaterial,
    materialTopic,
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

  const [stage, setStage] = useState("quiz");
  const [topic, setTopic] = useState(initialTopic || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState("");
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [technicalScore, setTechnicalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState(false);

  const [learningQuestions, setLearningQuestions] = useState([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningSelected, setLearningSelected] = useState("");
  const [learningSelectedScore, setLearningSelectedScore] = useState(0);
  const [learningAnswers, setLearningAnswers] = useState([]);

  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState([]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && topic.trim()) {
      e.preventDefault();
      localStorage.setItem("quizTopic", topic);
      setStage("learning");
    }
  };

  const displayQuestions = questions && questions.length > 0 ? questions : generatedQuizQuestions;

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

      const questionLine = lines[0];
      const questionCorrectMatch = questionLine.match(/Correct Answer:\s*([A-D])/i);
      if (questionCorrectMatch) {
        correctAnswerLetter = questionCorrectMatch[1];
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        const correctMatch = line.match(/\*?Correct Answer:\*?\s*([A-D])/i);
        if (correctMatch) {
          correctAnswerLetter = correctMatch[1];
        }

        const optionMatch = line.match(/^([A-D])[.)]\s*(.+?)$/i);
        if (optionMatch) {
          let optionText = optionMatch[2].trim();
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

  useEffect(() => {
    if (stage === "learning") {
      loadLearningQuestions();
    }
  }, [stage]);

  useEffect(() => {
    const autoGenerateQuestions = async () => {
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

  // Stage: Quiz Questions
  if (stage === "quiz") {
    if (!displayQuestions.length && (extractedText || localStorage.getItem("extractedContent"))) {
      return (
        <div className="page-container">
          <div className="content-wrapper">
            <div className="content-card" style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📝 Technical Quiz</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Generating questions from your document...</p>
              {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner"></div>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                    Please wait while we generate quiz questions from your uploaded document...
                  </p>
                </div>
              )}
              {error && <p style={{ color: 'var(--color-error)', marginTop: '12px' }}>{error}</p>}
            </div>
          </div>
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

      const nextQuestion = () => {
        const nextAnswers = [...quizAnswers, quizSelected];
        setQuizAnswers(nextAnswers);
        setQuizSelected("");
        setQuizAnswerSubmitted(false);
        setAnswerLocked(false);

        if (quizIndex + 1 < displayQuestions.length) {
          setQuizIndex(quizIndex + 1);
        } else {
          completeQuiz();
        }
      };

      return (
        <div className="page-container">
          <div className="content-wrapper">
            <div className="content-card">
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>📝 Technical Quiz</h2>
              
              {/* Progress */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'var(--color-gray-200)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${((quizIndex + 1) / displayQuestions.length) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  Question {quizIndex + 1} of {displayQuestions.length}
                </p>
              </div>

              <h3 style={{ margin: '24px 0', color: 'var(--text-primary)' }}>
                {displayQuestions[quizIndex]?.question}
              </h3>

              {displayQuestions[quizIndex]?.options.map((opt, i) => {
                const isCorrect = opt === displayQuestions[quizIndex]?.answer;
                const isSelected = quizSelected === opt;
                const showHighlight = quizSelected !== "";
                
                return (
                  <label
                    key={i}
                    className={`quiz-option ${isSelected ? 'selected' : ''} ${showHighlight && isCorrect ? 'correct' : ''} ${showHighlight && isSelected && !isCorrect ? 'incorrect' : ''} ${answerLocked ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!answerLocked) {
                        setQuizSelected(opt);
                        setAnswerLocked(true);
                      }
                    }}
                  >
                    <div className="quiz-option-content">
                      <input
                        type="radio"
                        name="quiz-option"
                        value={opt}
                        checked={quizSelected === opt}
                        disabled={answerLocked}
                        onChange={() => {}}
                      />
                      <span className="quiz-option-text">{opt}</span>
                    </div>
                    {showHighlight && (isCorrect || isSelected) && (
                      <span className={`quiz-option-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
                  </label>
                );
              })}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => {
                    if (quizIndex > 0) {
                      const prevIndex = quizIndex - 1;
                      const prevSelected = quizAnswers[prevIndex] || "";
                      const newAnswers = quizAnswers.slice(0, prevIndex);
                      setQuizAnswers(newAnswers);
                      setQuizIndex(prevIndex);
                      setQuizSelected(prevSelected);
                      setQuizAnswerSubmitted(false);
                      setAnswerLocked(false);
                    } else {
                      setQuizIndex(0);
                      setQuizAnswers([]);
                      setQuizSelected("");
                      setQuizAnswerSubmitted(false);
                      setStage("score");
                    }
                  }}
                  className="btn btn-outline"
                  style={{ flex: '0 0 auto' }}
                >
                  ← Previous
                </button>

                <button 
                  onClick={nextQuestion} 
                  disabled={!quizSelected}
                  className="enterprise-btn"
                  style={{ flex: 1 }}
                >
                  {quizIndex + 1 < displayQuestions.length ? 'Next →' : 'Complete Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No questions state
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>No Quiz Available</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please generate a quiz from the Home page first.
            </p>
            <button onClick={() => navigate("/")} className="enterprise-btn">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stage: Show Score
  if (stage === "score") {
    if (fromMaterial) {
      return (
        <div className="page-container">
          <div className="content-wrapper">
            <div className="content-card">
              <h2 style={{ color: 'var(--text-primary)', textAlign: 'center', marginBottom: '24px' }}>✅ Quiz Complete!</h2>

              <div className="score-display">
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Your Quiz Score</p>
                <p className="score-value">{technicalScore}%</p>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>
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
                className="enterprise-btn"
                style={{ marginBottom: '16px' }}
              >
              ← Back to Learning Material
              </button>

              <button
                onClick={() => {
                  setQuizIndex(0);
                  setQuizAnswers([]);
                  setQuizSelected("");
                  setStage("quiz");
                }}
                className="enterprise-btn secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-card">
            <h2 style={{ color: 'var(--text-primary)', textAlign: 'center', marginBottom: '24px' }}>📊 Quiz Complete!</h2>

            <div className="score-display">
              <p style={{ fontSize: '14px', opacity: 0.9 }}>Technical Score</p>
              <p className="score-value">{technicalScore}%</p>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                {correctCount}/{displayQuestions.length} correct
              </p>
            </div>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' , textAlign: "center"}}>Master a New Skill</h3>
            <p style={{ textAlign: "center" }}> What do you want to master next? We'll generate a quiz tailored to your learning goals.</p>
            <input
              type="text"
              placeholder="e.g., Java, React, Python for Data Science...."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyPress}
              className="enterprise-input"
              style={{ marginBottom: '16px' }}
            />

            <button
              onClick={() => {
                if (topic.trim()) {
                  localStorage.setItem("quizTopic", topic);
                  setStage("learning");
                }
              }}
              disabled={!topic.trim()}
              className="enterprise-btn"
              style={{ marginBottom: '16px' }}
            >
              Begin Level Assessment →
            </button>

            <button
              onClick={() => {
                setQuizIndex(0);
                setQuizAnswers([]);
                setQuizSelected("");
                setStage("quiz");
              }}
              className="enterprise-btn secondary"
            >
              ← Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function for psychometric profile
  const analyzePsychometricProfile = (answers, questions) => {
    const levels = {};
    const categories = ["technicalFamiliarity", "documentationSkill", "learningGoal", "applicationConfidence", "learningBehavior"];

    answers.forEach((score, idx) => {
      const category = categories[idx];
      if (score === 0) levels[category] = "Beginner";
      else if (score === 1) levels[category] = "Intermediate";
      else levels[category] = "Advanced";
    });

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
        <div className="page-container">
          <div className="content-wrapper">
            <div className="content-card" style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>📊 Loading Learner Level Assessment...</h2>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      );
    }

    if (learningQuestions.length === 0) {
      return (
        <div className="page-container">
          <div className="content-wrapper">
            <div className="content-card">
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📊 Learner Level Assessment</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                This diagnostic test measures your technical proficiency across multiple dimensions.
              </p>

              <button
                onClick={() => {
                  setLearningIndex(0);
                  setLearningAnswers([]);
                  setLearningSelected("");
                  setStage("score");
                }}
                className="btn btn-outline"
                style={{ marginBottom: '16px', marginRight: '12px' }}
              >
                ← Back
              </button>

              <button onClick={loadLearningQuestions} disabled={loading} className="enterprise-btn">
                {loading ? "Loading..." : "Start Assessment →"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const completeLearningAssessment = async () => {
      const totalPoints = learningAnswers.reduce((acc, val) => acc + val, 0);
      const maxPoints = learningQuestions.length * 2;
      const learnScore = Math.round((totalPoints / maxPoints) * 100);

      localStorage.setItem("learningScore", learnScore.toString());

      const techScore = parseInt(localStorage.getItem("technicalScore") || "50");
      const storedTopic = localStorage.getItem("quizTopic") || topic;
      const techLevel = techScore >= 80 ? "Advanced" : techScore >= 60 ? "Intermediate" : "Beginner";

      const profile = analyzePsychometricProfile(learningAnswers, learningQuestions);

      navigate("/result", {
        state: {
          score: techScore,
          questions: displayQuestions,
          topic: storedTopic,
          technicalScore: techScore,
          learningScore: learnScore,
          combinedAnalysis: {
            combinedAnalysis: `Technical: ${techLevel} level based on quiz score. Learning preference determined through assessment.`,
            psychometricProfile: profile
          },
          mode: "quiz",
          userId,
          sourceType,
          sourceUrl,
          extractedText,
          skills,
          strengths,
          weakAreas
        }
      });
    };

    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="content-card">
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>📊 Learner Level Assessment</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'var(--color-gray-200)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: `${((learningIndex + 1) / learningQuestions.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
                Question {learningIndex + 1} of {learningQuestions.length}
              </p>
            </div>

            <h3 style={{ color: 'var(--text-primary)', margin: '24px 0', fontSize: '20px', fontWeight: '600' }}>
              {learningQuestions[learningIndex]?.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {learningQuestions[learningIndex]?.options.map((option, idx) => {
                // Handle both string and object formats
                const optionLabel = typeof option === 'string' ? option : (option.label || option.text || '');
                const isSelected = learningSelected === optionLabel;
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setLearningSelected(optionLabel);
                      setLearningSelectedScore(idx); // Use index as score (0, 1, 2)
                    }}
                    style={{ 
                      textAlign: 'left', 
                      justifyContent: 'flex-start', 
                      padding: '16px 20px',
                      backgroundColor: isSelected ? '#dbeafe' : '#ffffff',
                      color: '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '500',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: '500' }}>{optionLabel}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  if (learningIndex > 0) {
                    const prevAnswers = learningAnswers.slice(0, -1);
                    setLearningAnswers(prevAnswers);
                    setLearningIndex(learningIndex - 1);
                    setLearningSelected("");
                  } else {
                    setStage("score");
                  }
                }}
                className="btn btn-outline"
                style={{ flex: '0 0 auto' }}
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  const newAnswers = [...learningAnswers, learningSelectedScore];
                  setLearningAnswers(newAnswers);

                  if (learningIndex + 1 < learningQuestions.length) {
                    setLearningIndex(learningIndex + 1);
                    setLearningSelected("");
                  } else {
                    completeLearningAssessment();
                  }
                }}
                disabled={!learningSelected}
                className="enterprise-btn"
                style={{ flex: 1 }}
              >
                {learningIndex + 1 < learningQuestions.length ? 'Next →' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default QuizPage;
