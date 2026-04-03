import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
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
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // Calculate percentage
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  
  // Dynamic color gradient based on score
  const getScoreGradient = () => {
    if (percentage <= 39) {
      return { start: '#FF7E5F', end: '#FEB47B', label: 'Soft Red/Orange' };
    } else if (percentage <= 70) {
      return { start: '#48C6EF', end: '#6F86D6', label: 'Blue/Amber' };
    } else {
      return { start: '#11998E', end: '#38EF7D', label: 'Emerald Green' };
    }
  };
  
  const scoreGradient = getScoreGradient();
  
  // Get motivational text based on score
  const getMotivationalText = () => {
    if (percentage <= 39) return "Keep Growing!";
    if (percentage <= 70) return "Good Progress!";
    return "Excellent Work!";
  };
  
  // Circular progress ring calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  // Trigger confetti on mount (lightweight)
  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Lightweight confetti burst (2-3s duration, low density)
    const duration = 2500;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.7 },
        colors: [scoreGradient.start, scoreGradient.end, '#2D5A5A']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.7 },
        colors: [scoreGradient.start, scoreGradient.end, '#2D5A5A']
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, [scoreGradient]);
  
  // Animate percentage from 0 to final
  useEffect(() => {
    const animationDuration = 1400; // 1.4s
    const startTime = Date.now();
    
    const animatePercentage = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(Math.round(easeOut * percentage));
      
      if (progress < 1) {
        requestAnimationFrame(animatePercentage);
      }
    };
    
    // Start animation after a small delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(animatePercentage);
    }, 400);
    
    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Inter", "Montserrat", system-ui, sans-serif'
    }}>
      {/* Main Glassmorphism Card */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '48px 40px',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Top Section - Circular Score Gauge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
        }}>
          {/* Success Trophy Icon */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
            }}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.4s ease-out 0.4s'
                }}
              >
                <defs>
                  <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                </defs>
                <path d="M12 15C15.866 15 19 11.866 19 8V6H5V8C5 11.866 8.13401 15 12 15Z" fill="url(#trophyGradient)"/>
                <path d="M5 6H19V8C19 8 17 10 12 10C7 10 5 8 5 8V6Z" fill="url(#trophyGradient)"/>
                <path d="M12 10V13" stroke="#B8860B" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 13H16V15C16 16.1046 15.1046 17 14 17H10C8.89543 17 8 16.1046 8 15V13Z" fill="url(#trophyGradient)" stroke="#B8860B" strokeWidth="1"/>
                <circle cx="12" cy="5" r="2" fill="#FFD700"/>
                <path d="M11 3H13V4H11V3Z" fill="#FFD700"/>
              </svg>
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div style={{ position: 'relative', width: '240px', height: '240px' }}>
            <svg 
              width="240" 
              height="240" 
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle - track */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="6"
              />
              {/* Progress circle with gradient */}
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={scoreGradient.start} />
                  <stop offset="100%" stopColor={scoreGradient.end} />
                </linearGradient>
              </defs>
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 0.1s ease-out'
                }}
              />
            </svg>
            
            {/* Center text layout */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Large Percentage */}
              <span style={{
                fontSize: '64px',
                fontWeight: '800',
                color: '#FFFFFF',
                display: 'block',
                lineHeight: 1,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease-out 0.6s',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                {animatedPercentage}%
              </span>
              
              {/* Fraction text */}
              <span style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '8px',
                display: 'block',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease-out 0.7s'
              }}>
                {correctCount}/{totalQuestions} Correct
              </span>
              
              {/* Motivational text */}
              <span style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#FFD700',
                marginTop: '12px',
                display: 'block',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease-out 0.8s'
              }}>
                {getMotivationalText()}
              </span>
            </div>
          </div>
        </div>

        {/* Title - Congratulations with gradient */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E8E8E8 50%, #C0C0C0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.5s',
          textShadow: '0 2px 4px rgba(255,255,255,0.3)'
        }}>
          Congratulations!
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: '24px',
          lineHeight: '1.6',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.55s'
        }}>
          You've successfully completed the technical evaluation!
        </p>

        {/* Topic display */}
        {topic && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '32px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease-out 0.65s'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Topic: </span>
            <span style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '14px' }}>{topic}</span>
          </div>
        )}

        {/* Next Steps Section */}
        <div style={{
          marginBottom: '20px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.7s'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Next Steps
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.75s'
        }}>
          {/* Primary CTA - Begin Level Assessment / Continue - Solid Style */}
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
                background: 'linear-gradient(135deg, #5FB0B7 0%, #4A9A9F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 28px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(95, 176, 183, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(95, 176, 183, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(95, 176, 183, 0.4)';
              }}
            >
              <span>Continue Learning</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={onContinueToLearning}
              style={{
                background: 'linear-gradient(135deg, #5FB0B7 0%, #4A9A9F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 28px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(95, 176, 183, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(95, 176, 183, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(95, 176, 183, 0.4)';
              }}
            >
              <span>Begin Level Assessment</span>
              <ArrowRight size={18} />
            </button>
          )}

          {/* Secondary Button - Review Answers / Retake Quiz (Outline style) */}
          <button
            onClick={onRetakeQuiz}
            style={{
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
          >
            <RotateCcw size={18} />
            <span>Review Answers</span>
          </button>

          {/* Back to Dashboard Button (Solid style) */}
          <button
            onClick={() => navigate("/")}
            style={{
              background: 'linear-gradient(135deg, #5FB0B7 0%, #4A9A9F 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(95, 176, 183, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(95, 176, 183, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(95, 176, 183, 0.4)';
            }}
          >
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        right: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${scoreGradient.start}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-200px',
        left: '-200px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${scoreGradient.end}10 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
    </div>
  );
}

export default SuccessResultPage;
