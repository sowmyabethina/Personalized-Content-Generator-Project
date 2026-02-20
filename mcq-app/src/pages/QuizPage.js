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
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Technical quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState("");
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [answerLocked, setAnswerLocked] = useState(false); // Lock answer after selection
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
  
  // Show celebration overlay when quiz is completed (regardless of stage)
  if (showCelebration) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.3s ease-out"
      }}>
        {/* Confetti */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: ["#10b981", "#2563EB", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][Math.floor(Math.random() * 6)],
                top: "-20px",
                left: `${Math.random() * 100}%`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animation: `confettiFall ${Math.random() * 2 + 1.5}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: 0.8
              }}
            />
          ))}
        </div>

        {/* Success Content */}
        <div style={{
          textAlign: "center",
          color: "#1E293B",
          zIndex: 1,
          animation: "scaleIn 0.5s ease-out"
        }}>
          {/* Animated Green Checkmark */}
          <div style={{
            width: "100px",
            height: "100px",
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            animation: "pulseCheck 1s ease-in-out infinite"
          }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{ 
                strokeDasharray: 30, 
                strokeDashoffset: 30,
                animation: "checkDraw 0.5s ease-out 0.3s forwards" 
              }} />
            </svg>
          </div>
          
          <h2 style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "12px",
            color: "#1E293B"
          }}>
            Congratulations! Quiz Completed.
          </h2>
          
          <p style={{
            fontSize: "16px",
            color: "#475569",
            maxWidth: "400px"
          }}>
            Analyzing your results and preparing your profile...
          </p>
        </div>
      </div>
    );
  }

  if (stage === "quiz") {
    // Show loading when auto-generating questions
    if (!displayQuestions.length && (extractedText || localStorage.getItem("extractedContent"))) {
      return (
        <div className="glass-card">
          <h2>📝 Technical Quiz</h2>
          <p style={{ marginBottom: "20px", color: "#475569" }}>Generating questions from your document...</p>
          {loading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid #E2E8F0",
                borderTop: "4px solid #2563EB",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 15px"
              }}></div>
              <p style={{ color: "#475569" }}>Please wait while we generate quiz questions from your uploaded document...</p>
            </div>
          )}
          {error && <p style={{ color: "#DC2626", marginTop: "10px" }}>{error}</p>}
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
          // Show celebration before transitioning to score
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setStage("score");
          }, 2000);
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
          // Show celebration before transitioning to score
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setStage("score");
          }, 2000);
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
        setAnswerLocked(false); // Unlock for next question

        if (quizIndex + 1 < displayQuestions.length) {
          setQuizIndex(quizIndex + 1);
        } else {
          completeQuiz();
        }
      };

      return (
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ 
            color: "#1E293B", 
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: '600'
          }}>Technical Quiz</h2>
          
          {/* Dual-row progress header */}
          <div style={{ marginBottom: '15px' }}>
            {/* Row 1: Animated progress bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: '#F1F5F9',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${((quizIndex + 1) / displayQuestions.length) * 100}%`,
                height: '100%',
                background: '#3B82F6',
                borderRadius: '2px',
                transition: 'width 0.4s ease-out'
              }} />
            </div>
            {/* Row 2: Question count text */}
            <p style={{ 
              color: '#475569', 
              fontSize: '14px',
              margin: 0,
              fontWeight: '500'
            }}>Question {quizIndex + 1} of {displayQuestions.length}</p>
          </div>

          <h3 style={{ margin: "20px 0", color: '#1E293B' }}>{displayQuestions[quizIndex]?.question}</h3>

          {displayQuestions[quizIndex]?.options.map((opt, i) => {
            const isCorrect = opt === displayQuestions[quizIndex]?.answer;
            const isSelected = quizSelected === opt;
            const showHighlight = quizSelected !== "";
            
            // Helper function to highlight code terms
            const highlightCode = (text) => {
              const codeTerms = ['useEffect', 'useState', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue', 'createElement', 'render', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount', 'constructor', 'getDerivedStateFromProps', 'getSnapshotBeforeUpdate', 'shouldComponentUpdate', 'React', 'Vue', 'Angular', 'Node', 'Express', 'MongoDB', 'SQL', 'API', 'JSON', 'AJAX', 'DOM', 'BOM', 'CSS', 'HTML', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring', 'ASP.NET', 'GraphQL', 'REST', 'WebSocket', 'HTTP', 'HTTPS', 'TCP', 'UDP', 'DNS', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'npm', 'yarn', 'webpack', 'babel', 'eslint', 'prettier', 'jest', 'mocha', 'cypress', 'selenium', 'redux', 'mobx', 'vuex', 'pinia', 'axios', 'fetch', 'async', 'await', 'promise', 'callback', 'closure', 'hoisting', 'prototype', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'interface', 'abstract', 'class', 'function', 'variable', 'constant', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined', 'NaN', 'Infinity', 'this', 'super', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'Error', 'Event', 'Listener', 'Handler', 'Component', 'Props', 'State', 'Ref', 'Context', 'Provider', 'Consumer', 'Hook', 'Effect', 'Memo', 'Callback', 'Portal', 'Fragment', 'Suspense', 'Lazy', 'ForwardRef', 'memo', 'lazy', 'Suspense'];
              const parts = text.split(/(\s+)/);
              return parts.map((part, idx) => {
                const cleanPart = part.trim();
                if (codeTerms.some(term => term === cleanPart || term.toLowerCase() === cleanPart.toLowerCase())) {
                  return <code key={idx} style={{
                    background: '#F1F5F9',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    color: '#2563EB'
                  }}>{part}</code>;
                }
                return part;
              });
            };
            
            return (
              <label
                key={i}
                className="option"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  background: showHighlight
                    ? isCorrect
                      ? '#DCFCE7'
                      : isSelected
                      ? '#FEE2E2'
                      : '#FFFFFF'
                    : '#FFFFFF',
                  borderColor: showHighlight
                    ? isCorrect
                      ? '#22c55e'
                      : isSelected
                      ? '#ef4444'
                      : '#E2E8F0'
                    : '#E2E8F0',
                  borderWidth: showHighlight ? '2px' : '1px',
                  borderStyle: 'solid',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  cursor: answerLocked ? 'not-allowed' : 'pointer',
                  opacity: 1,
                  transform: answerLocked ? 'none' : 'translateY(0)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!answerLocked) {
                    e.currentTarget.style.borderColor = '#2563EB';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answerLocked) {
                    e.currentTarget.style.borderColor = showHighlight 
                      ? (isCorrect ? '#22c55e' : isSelected ? '#ef4444' : '#E2E8F0')
                      : '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <input
                    type="radio"
                    name="quiz-option"
                    value={opt}
                    checked={quizSelected === opt}
                    disabled={answerLocked}
                    onChange={(e) => {
                      if (!answerLocked) {
                        setQuizSelected(e.target.value);
                        setAnswerLocked(true);
                      }
                    }}
                    style={{ marginRight: '12px', accentColor: '#2563EB' }}
                  />
                  <span style={{
                    color: '#1E293B',
                    fontWeight: '500',
                    opacity: 1,
                    flex: 1
                  }}>
                    {highlightCode(opt)}
                  </span>
                </div>
              </label>
            );
          })}

          {/* Action buttons container */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '25px',
            flexDirection: 'row',
            alignItems: 'stretch'
          }}>
            {/* Previous Button - Ghost style */}
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
              style={{
                padding: '14px 24px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.background = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.background = '#FFFFFF';
              }}
            >
              ← Previous
            </button>

            {/* Next Button - Primary CTA */}
            <button 
              onClick={nextQuestion} 
              disabled={!quizSelected}
              style={{ 
                marginTop: 0,
                flex: 1,
                padding: '14px 32px',
                borderRadius: '10px',
                border: 'none',
                background: quizSelected 
                  ? '#2563EB'
                  : '#94A3B8',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: '600',
                cursor: quizSelected ? 'pointer' : 'not-allowed',
                opacity: quizSelected ? 1 : 0.5,
                transition: 'all 0.3s ease',
                boxShadow: quizSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transform: quizSelected ? 'translateY(0)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (quizSelected) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
              }}
            >
              {quizIndex + 1 < displayQuestions.length ? 'Next →' : 'Complete Quiz'}
            </button>
          </div>
        </div>
      );
    }
  }

  // Stage: Show Score and Enter Topic
  if (stage === "score") {
    // If quiz came from learning material, show different UI
    if (fromMaterial) {
      return (
        <div className="glass-card" style={{ maxWidth: "500px", margin: "0 auto", padding: "30px" }}>
          {/* Score Card - Compact light theme */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "20px",
            color: "#1E293B",
            marginBottom: "25px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            animation: "fadeIn 0.5s ease-out"
          }}>
            <p style={{ 
              fontSize: "11px", 
              color: "#475569",
              margin: "0 0 10px 0",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: "600"
            }}>Technical Score</p>
            <div style={{ position: "relative", width: "110px", height: "110px", margin: "0 auto" }}>
              <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="8"
                />
                <circle
                  cx="55"
                  cy="55"
                  r="48"
                  fill="none"
                  stroke={technicalScore > 70 ? "#10b981" : "#3B82F6"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(technicalScore || 0) * 3.01} 301`}
                  style={{ transition: "stroke-dasharray 1s ease-out, stroke 0.3s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "28px",
                fontWeight: "bold",
                fontFamily: "'Courier New', Courier, monospace",
                color: "#1E293B"
              }}>
                {technicalScore}%
              </div>
            </div>
            <p style={{ fontSize: "12px", margin: "10px 0 0 0", color: "#475569" }}>
              {correctCount}/{displayQuestions.length} correct
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            animation: "fadeIn 0.5s ease-out 0.2s both"
          }}>
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
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "15px",
                marginBottom: "12px",
                background: "#2563EB",
                border: "none",
                borderRadius: "10px",
                color: "#FFFFFF",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.02)";
                e.target.style.filter = "brightness(1.1)";
                e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.filter = "brightness(1)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
              }}
            >
              Back to Learning Material
            </button>

            <button
              onClick={() => {
                setRetakeLoading(true);
                setTimeout(() => {
                  setQuizIndex(0);
                  setQuizAnswers([]);
                  setQuizSelected("");
                  setStage("quiz");
                  setRetakeLoading(false);
                }, 900);
              }}
              disabled={retakeLoading}
              style={{
                marginTop: "0",
                background: "transparent",
                border: "1px solid #E2E8F0",
                padding: "10px 20px",
                width: "100%",
                borderRadius: "10px",
                cursor: retakeLoading ? "not-allowed" : "pointer",
                color: "#2563EB",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.3s ease",
                opacity: retakeLoading ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!retakeLoading) {
                  e.target.style.background = "#F8FAFC";
                  e.target.style.borderColor = "#2563EB";
                }
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "#E2E8F0";
              }}
            >
              {retakeLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ 
                    display: "inline-block",
                    width: "14px", 
                    height: "14px", 
                    border: "2px solid #E2E8F0", 
                    borderTopColor: "#2563EB", 
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}></span>
                  Resetting Quiz...
                </span>
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        </div>
      );
    }

    // Original flow for quiz not from learning material
    return (
      <div className="glass-card" style={{ maxWidth: "500px", margin: "0 auto", padding: "30px" }}>
        {/* Score Card - Compact light theme with staggered animation */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "20px",
          color: "#1E293B",
          marginBottom: "25px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          animation: "fadeIn 0.5s ease-out"
        }}>
          <p style={{ 
            fontSize: "11px", 
            color: "#475569",
            margin: "0 0 10px 0",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            fontWeight: "600"
          }}>Technical Score</p>
          <div style={{ position: "relative", width: "110px", height: "110px", margin: "0 auto" }}>
            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="8"
              />
              <circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke={technicalScore > 70 ? "#10b981" : "#3B82F6"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(technicalScore || 0) * 3.01} 301`}
                style={{ transition: "stroke-dasharray 1s ease-out, stroke 0.3s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "28px",
              fontWeight: "bold",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#1E293B"
            }}>
              {technicalScore}%
            </div>
          </div>
          <p style={{ fontSize: "12px", margin: "10px 0 0 0", color: "#475569" }}>
            {correctCount}/{displayQuestions.length} correct
          </p>
        </div>

        {/* Learning Section with staggered animation */}
        <div style={{
          animation: "fadeIn 0.5s ease-out 0.2s both"
        }}>
          <h2 style={{ 
            color: "#1E293B", 
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "8px"
          }}>Master a New Skill</h2>
          <p style={{ 
            color: "#475569", 
            textAlign: "center",
            fontSize: "13px",
            marginBottom: "20px"
          }}>What do you want to master next? We'll generate a custom assessment for you.</p>

          <input
            type="text"
            placeholder="e.g., Advanced React, Python for Data Science..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "14px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#1E293B",
              outline: "none",
              marginBottom: "0",
              boxSizing: "border-box",
              transition: "all 0.25s ease"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563EB";
              e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E2E8F0";
              e.target.style.boxShadow = "none";
            }}
          />

          <button
            onClick={() => {
              if (topic.trim()) {
                localStorage.setItem("quizTopic", topic);
                setStage("learning");
              }
            }}
            disabled={!topic.trim()}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "15px",
              marginTop: "2rem",
              background: "#2563EB",
              border: "none",
              borderRadius: "10px",
              color: "#FFFFFF",
              fontWeight: "600",
              cursor: !topic.trim() ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: topic.trim() ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "none",
              opacity: topic.trim() ? 1 : 0.6,
              transform: topic.trim() ? "scale(1)" : "scale(1)"
            }}
            onMouseOver={(e) => {
              if (topic.trim()) {
                e.target.style.transform = "scale(1.03)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = topic.trim() ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none";
            }}
          >
            Begin Level Assessment →
          </button>

          <button
            onClick={() => {
              setRetakeLoading(true);
              setTimeout(() => {
                setQuizIndex(0);
                setQuizAnswers([]);
                setQuizSelected("");
                setStage("quiz");
                setRetakeLoading(false);
              }, 900);
            }}
            disabled={retakeLoading}
            style={{
              marginTop: "12px",
              background: "transparent",
              border: "1px solid #E2E8F0",
              padding: "10px 20px",
              width: "100%",
              borderRadius: "10px",
              cursor: retakeLoading ? "not-allowed" : "pointer",
              color: "#2563EB",
              fontSize: "13px",
              fontWeight: "500",
              transition: "all 0.3s ease",
              opacity: retakeLoading ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!retakeLoading) {
                e.target.style.background = "#F8FAFC";
                e.target.style.borderColor = "#2563EB";
              }
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
              e.target.style.borderColor = "#E2E8F0";
            }}
          >
            {retakeLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ 
                  display: "inline-block",
                  width: "14px", 
                  height: "14px", 
                  border: "2px solid #E2E8F0", 
                  borderTopColor: "#2563EB", 
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }}></span>
                Resetting Quiz...
              </span>
            ) : (
              "← Retake Quiz"
            )}
          </button>
        </div>
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
        <div className="glass-card">
          <h2 style={{ color: "#1E293B" }}>📊 Loading Learner Level Assessment...</h2>
        </div>
      );
    }

    if (learningQuestions.length === 0) {
      return (
        <div className="glass-card">
          <h2 style={{ color: "#1E293B" }}>📊 Learner Level Assessment</h2>
          <p style={{ marginBottom: "20px", color: "#475569" }}>This diagnostic test measures your technical proficiency across multiple dimensions.</p>

          {/* Back Button */}
          <button
            onClick={() => {
              setLearningIndex(0);
              setLearningAnswers([]);
              setLearningSelected("");
              setStage("score");
            }}
            style={{ marginBottom: "15px", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", color: "#475569", fontSize: "14px", fontWeight: "500", marginRight: "10px" }}
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
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto", padding: "30px" }}>
        {/* Progress Bar */}
        <div style={{ 
          width: "100%", 
          height: "4px", 
          background: "#F1F5F9", 
          borderRadius: "2px",
          marginBottom: "20px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${((learningIndex + 1) / learningQuestions.length) * 100}%`,
            height: "100%",
            background: "#3B82F6",
            borderRadius: "2px",
            transition: "width 0.4s ease"
          }} />
        </div>

        <h2 style={{ color: "#1E293B", marginBottom: "5px" }}>📊 Learner Level Assessment</h2>
        <p style={{ color: "#475569", fontSize: "13px", marginBottom: "25px" }}>Question {learningIndex + 1} of {learningQuestions.length}</p>

        <div key={learningIndex} style={{ animation: "slideIn 0.4s ease-out" }}>
          <h3 style={{ margin: "0 0 20px", color: "#1E293B", fontSize: "18px", lineHeight: "1.5" }}>{learningQuestions[learningIndex]?.question}</h3>

          {learningQuestions[learningIndex]?.options.map((opt, i) => (
            <label 
              key={i} 
              style={{ 
                display: "flex",
                alignItems: "flex-start",
                padding: "14px 16px",
                marginBottom: "12px",
                borderRadius: "10px",
                border: learningSelected === opt ? "1px solid #2563EB" : "1px solid #E2E8F0",
                background: learningSelected === opt ? "#DBEAFE" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: learningSelected === opt ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none"
              }}
              onMouseOver={(e) => {
                if (learningSelected !== opt) {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (learningSelected !== opt) {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <input
                type="radio"
                name="learning-option"
                value={opt}
                checked={learningSelected === opt}
                onChange={(e) => handleOptionChange(opt, i)}
                style={{ 
                  marginTop: "4px", 
                  marginRight: "12px",
                  accentColor: "#2563EB",
                  width: "18px",
                  height: "18px"
                }}
              />
              <span style={{ color: "#1E293B", fontSize: "15px", lineHeight: "1.4" }}>{opt}</span>
            </label>
          ))}
        </div>

        <button 
          onClick={nextQuestion} 
          disabled={!learningSelected} 
          style={{ 
            marginTop: "25px",
            width: "100%",
            padding: "14px 20px",
            fontSize: "16px",
            fontWeight: "600",
            border: "none",
            borderRadius: "10px",
            cursor: learningSelected ? "pointer" : "not-allowed",
            opacity: learningSelected ? 1 : 0.5,
            background: learningSelected ? "#2563EB" : "#94A3B8",
            color: "#FFFFFF",
            transition: "all 0.3s ease",
            boxShadow: learningSelected ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none"
          }}
          onMouseOver={(e) => {
            if (learningSelected) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = learningSelected ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none";
          }}
        >
          {learningIndex + 1 < learningQuestions.length ? "Next →" : "Complete Assessment"}
        </button>

        <button
          onClick={() => {
            setLearningIndex(0);
            setLearningAnswers([]);
            setLearningSelected("");
            setStage("score");
          }}
          style={{ 
            marginTop: "12px", 
            background: "transparent", 
            border: "1px solid #E2E8F0",
            padding: "10px 20px", 
            width: "100%",
            borderRadius: "8px",
            cursor: "pointer", 
            color: "#2563EB",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#F8FAFC";
            e.target.style.borderColor = "#2563EB";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
            e.target.style.borderColor = "#E2E8F0";
          }}
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
      return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim();
    };

    return (
      <div className="glass-card" style={{ maxWidth: "550px", margin: "0 auto", padding: "1.5rem" }}>
        <h2 style={{ color: "#1E293B", marginBottom: "20px", fontSize: "22px" }}>Personalized Learning Dashboard</h2>

        {/* Assessment Summary */}
        <div style={{ 
          background: "#FFFFFF", 
          padding: "15px", 
          borderRadius: "10px", 
          marginBottom: "12px", 
          textAlign: "left",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#1E293B", fontSize: "14px" }}>📊 Your Assessment Profile:</h4>
          <p style={{ color: "#475569", marginBottom: "5px", fontSize: "14px" }}>Technical Level: <strong style={{ color: "#1E293B" }}>{techLevel}</strong> ({techScore}%)</p>
          <p style={{ color: "#475569", marginBottom: "5px", fontSize: "14px" }}>Learner Level: <strong style={{ color: "#1E293B" }}>{learnerLevel}</strong> ({learnScore}%)</p>
          <p style={{ color: "#475569", marginBottom: "0", fontSize: "14px" }}>Topic: <strong style={{ color: "#1E293B" }}>{storedTopic}</strong></p>
        </div>

        {/* Psychometric Assessment */}
        <div style={{ 
          background: "#FFFFFF", 
          padding: "15px", 
          borderRadius: "10px", 
          marginBottom: "15px", 
          textAlign: "left",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
        }}>
          <h5 style={{ margin: "0 0 10px 0", color: "#1E293B", fontSize: "13px" }}>Psychometric Assessment:</h5>

          {Object.entries(psychometricProfile).map(([key, value]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "#475569", fontSize: "13px" }}>{formatCategory(key)}:</span>
              <span style={{
                color: value?.trim() === "Advanced" ? "#059669" : value?.trim() === "Intermediate" ? "#D97706" : "#DC2626",
                fontWeight: "600",
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "12px",
                background: value?.trim() === "Advanced" ? "#D1FAE5" : value?.trim() === "Intermediate" ? "#FEF3C7" : "#FEE2E2"
              }}>{value?.trim()}</span>
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
          style={{ 
            padding: "12px 20px", 
            fontSize: "15px",
            fontWeight: "600",
            width: "100%",
            marginBottom: "10px",
            background: "#2563EB",
            border: "none",
            borderRadius: "8px",
            color: "#FFFFFF",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
          }}
        >
          <strong>Create My Learning Plan</strong>
        </button>

        
        {/* Back Button - Ghost Style */}
        <button
          onClick={() => {
            setLearningIndex(0);
            setLearningAnswers([]);
            setLearningSelected("");
            setStage("learning");
          }}
          style={{ 
            marginBottom: "5px", 
            background: "transparent", 
            border: "1px solid #E2E8F0",
            padding: "8px 20px", 
            borderRadius: "6px", 
            cursor: "pointer", 
            color: "#2563EB",
            fontSize: "13px",
            fontWeight: "500",
            width: "100%",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.borderColor = "#2563EB";
            e.target.style.background = "#F8FAFC";
          }}
          onMouseOut={(e) => {
            e.target.style.borderColor = "#E2E8F0";
            e.target.style.background = "transparent";
          }}
        >
          ← Back to Learning Assessment
        </button>
        
      </div>
    );
  }

  // Fallback - no questions and not loading
  return (
    <div className="glass-card">
      <h2>No questions available</h2>
      <p>Please go back and extract a PDF first.</p>
      <button onClick={() => navigate("/")} style={{ marginTop: "10px" }}>
        ← Back to Home
      </button>
    </div>
  );
}

export default QuizPage;
