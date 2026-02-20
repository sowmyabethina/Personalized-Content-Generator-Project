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
      background: '#FFFFFF',
      padding: '10px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #E2E8F0',
      height: '60px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {showBackButton && (
          <button
            onClick={handleBackClick}
            style={{
              background: '#2563EB',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
            title="Go back"
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
          >
            ← Back
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1E293B' }}>
            Learning Platform
        </h2>
        <nav style={{ display: 'flex', gap: '6px', marginLeft: '20px' }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: location.pathname === link.path ? 'none' : 'none',
                color: location.pathname === link.path ? '#2563EB' : '#475569',
                fontWeight: location.pathname === link.path ? '600' : '400',
                fontSize: '14px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: location.pathname === link.path ? '#DBEAFE' : 'transparent',
                border: location.pathname === link.path ? '1px solid #2563EB' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: '#475569' }}>Profile</span>
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
            background: 'rgba(0, 0, 0, 0.5)',
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
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
            </div>
            <h3 style={{
              color: '#1E293B',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              margin: 0
            }}>Exit Quiz?</h3>
            <p style={{
              color: '#475569',
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
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFFFFF';
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
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
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
