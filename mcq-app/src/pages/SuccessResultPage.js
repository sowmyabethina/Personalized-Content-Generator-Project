import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
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
      backgroundColor: '#F4F7F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Inter", "Montserrat", system-ui, sans-serif'
    }}>
      {/* Main Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(45, 90, 90, 0.15), 0 0 0 1px rgba(45, 90, 90, 0.05)',
        padding: '48px 40px',
        maxWidth: '480px',
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
          {/* Success Checkmark */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
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
                size={36} 
                color="#10B981"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.4s ease-out 0.4s'
                }}
              />
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
                fontSize: '56px',
                fontWeight: '700',
                color: '#1E293B',
                display: 'block',
                lineHeight: 1,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease-out 0.6s'
              }}>
                {animatedPercentage}%
              </span>
              
              {/* Fraction text */}
              <span style={{
                fontSize: '18px',
                fontWeight: '500',
                color: '#64748B',
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
                fontSize: '14px',
                fontWeight: '400',
                color: scoreGradient.start,
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

        {/* Title and Description */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1E293B',
          marginBottom: '8px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.5s'
        }}>
          Assessment Complete!
        </h1>
        
        <p style={{
          fontSize: '15px',
          color: '#64748B',
          marginBottom: '24px',
          lineHeight: '1.6',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.55s'
        }}>
          Great job on completing the technical evaluation!
        </p>

        {/* Topic display */}
        {topic && (
          <div style={{
            backgroundColor: '#F4F7F6',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '32px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease-out 0.65s'
          }}>
            <span style={{ color: '#64748B', fontSize: '14px' }}>Topic: </span>
            <span style={{ color: '#2D5A5A', fontWeight: '600', fontSize: '14px' }}>{topic}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out 0.75s'
        }}>
          {/* Primary CTA - Begin Level Assessment / Continue */}
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
                background: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '18px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px 0 rgba(255, 126, 95, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px 0 rgba(255, 126, 95, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px 0 rgba(255, 126, 95, 0.4)';
              }}
            >
              <span>Continue Learning</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={onContinueToLearning}
              style={{
                background: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '18px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px 0 rgba(255, 126, 95, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px 0 rgba(255, 126, 95, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px 0 rgba(255, 126, 95, 0.4)';
              }}
            >
              <span>Begin Level Assessment</span>
              <ArrowRight size={18} />
            </button>
          )}

          {/* Secondary Button - Retake Quiz (Outline/Ghost style) */}
          <button
            onClick={onRetakeQuiz}
            style={{
              backgroundColor: 'transparent',
              color: '#2D5A5A',
              border: '2px solid #2D5A5A',
              borderRadius: '14px',
              padding: '16px 32px',
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
              e.target.style.backgroundColor = '#2D5A5A';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#2D5A5A';
            }}
          >
            <RotateCcw size={18} />
            <span>Retake Quiz</span>
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
