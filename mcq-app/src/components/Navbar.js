import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

function Navbar({ onBackClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitModal, setShowExitModal] = useState(false);

  const showBackButton = !["/", "/pdf-chat", "/progress", "/about", "/help"].includes(location.pathname);

  const handleBackClick = () => {
    // Only show confirmation dialog on Quiz page - call the callback prop or show modal
    if (location.pathname === "/quiz") {
      if (onBackClick) {
        onBackClick();
      } else {
        setShowExitModal(true);
      }
    } else {
      navigate(-1);
    }
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigate("/");
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const navLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/pdf-chat", label: "PDF Chat", icon: "📄" },
    { path: "/progress", label: "Progress", icon: "📈" },
    { path: "/about", label: "About", icon: "ℹ️" },
    { path: "/help", label: "Help", icon: "❓" },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '10px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      height: '60px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {showBackButton && (
          <button
            onClick={handleBackClick}
            style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #0d9488 100%)',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 10px rgba(55, 48, 163, 0.3)'
            }}
            title="Go back"
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 15px rgba(55, 48, 163, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 10px rgba(55, 48, 163, 0.3)';
            }}
          >
            ← Back
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            Learning Platform
        </h2>
        <nav style={{ display: 'flex', gap: '6px', marginLeft: '20px' }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: location.pathname === link.path ? 'none' : 'none',
                color: location.pathname === link.path ? '#0d9488' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: location.pathname === link.path ? '600' : '400',
                fontSize: '14px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: location.pathname === link.path ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
                border: location.pathname === link.path ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Profile</span>
        <UserButton />
      </div>

      {/* Custom Exit Confirmation Modal */}
      {showExitModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={handleExitCancel}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
            </div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              margin: 0
            }}>Exit Quiz?</h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              lineHeight: '1.5',
              marginBottom: '28px',
              margin: 0
            }}>Are you sure you want to exit the quiz? Your progress may be lost.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleExitCancel}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#e0e0e0',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExitConfirm}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
