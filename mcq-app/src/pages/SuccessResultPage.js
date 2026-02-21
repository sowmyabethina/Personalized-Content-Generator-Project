import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

function SuccessResultPage({ 
  score, 
  correctCount, 
  totalQuestions, 
  topic, 
  fromMaterial, 
  materialTopic,
  onContinueToLearning,
  onRetakeQuiz
}) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  // Calculate percentage
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  
  // Trigger confetti on mount
  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Confetti burst
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#6366F1', '#818CF8']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#6366F1', '#818CF8']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  // Circular progress ring calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Success Checkmark Animation */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
          }}>
            <CheckCircle 
              size={48} 
              color="#10B981"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.4s ease-out 0.4s'
              }}
            />
          </div>
        </div>

        {/* Feedback Message */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1E293B',
          marginBottom: '12px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.3s'
        }}>
          Assessment Completed!
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#64748B',
          marginBottom: '32px',
          lineHeight: '1.6',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.4s'
        }}>
          Great job! You've successfully finished the technical evaluation.
        </p>

        {/* Score Display - Circular Progress Ring */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s'
        }}>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg 
              width="180" 
              height="180" 
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 1s ease-out 0.8s'
                }}
              />
            </svg>
            {/* Score text in center */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{
                fontSize: '42px',
                fontWeight: '700',
                color: '#1E293B',
                display: 'block',
                lineHeight: 1
              }}>
                {correctCount}/{totalQuestions}
              </span>
              <span style={{
                fontSize: '14px',
                color: '#64748B',
                marginTop: '4px',
                display: 'block'
              }}>
                Score
              </span>
            </div>
          </div>
        </div>

        {/* Topic display */}
        {topic && (
          <div style={{
            backgroundColor: '#F1F5F9',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '32px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease-out 0.6s'
          }}>
            <span style={{ color: '#64748B', fontSize: '14px' }}>Topic: </span>
            <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>{topic}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.7s'
        }}>
          {/* Primary Button - View Detailed Report / Continue */}
          {fromMaterial ? (
            <button
              onClick={() => {
                const storedMaterial = localStorage.getItem("learningMaterialData");
                const learningMaterial = storedMaterial ? JSON.parse(storedMaterial) : null;
                navigate("/learning-material", {
                  state: {
                    learningMaterial: learningMaterial,
                    topic: materialTopic,
                    technicalLevel: percentage >= 80 ? "Advanced" : percentage >= 60 ? "Intermediate" : "Beginner",
                    learningScore: parseInt(localStorage.getItem("learningScore") || "50")
                  }
                });
              }}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px 0 rgba(99, 102, 241, 0.23)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px 0 rgba(99, 102, 241, 0.39)';
              }}
            >
              ← Back to Learning Material
            </button>
          ) : (
            <button
              onClick={onContinueToLearning}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px 0 rgba(99, 102, 241, 0.23)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px 0 rgba(99, 102, 241, 0.39)';
              }}
            >
              View Detailed Report →
            </button>
          )}

          {/* Secondary Button - Retake Quiz */}
          <button
            onClick={onRetakeQuiz}
            style={{
              backgroundColor: 'transparent',
              color: '#64748B',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#CBD5E1';
              e.target.style.backgroundColor = '#F8FAFC';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Decorative background circles */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}

export default SuccessResultPage;
