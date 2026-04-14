import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { PAGES } from "../constants/config.constants";

const NAV_LINKS = [
  { path: PAGES.HOME, label: "Home", icon: "🏠" },
  { path: PAGES.PDF_CHAT, label: "PDF Chat", icon: "📄" },
  { path: PAGES.PROGRESS, label: "Progress", icon: "📈" },
  { path: PAGES.ABOUT, label: "About", icon: "ℹ️" },
  { path: PAGES.HELP, label: "Help", icon: "❓" },
];

const NO_BACK_BUTTON_PATHS = NAV_LINKS.map((link) => link.path);

function Navbar({ onBackClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitModal, setShowExitModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  const showBackButton = !NO_BACK_BUTTON_PATHS.includes(location.pathname);

  const handleBackClick = () => {
    if (location.pathname === PAGES.QUIZ) {
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
    navigate(PAGES.HOME);
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (

    <>
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} />
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close sidebar">
            ✕
          </button>
        </div>
        <div className="sidebar-content">
          <p>Sidebar Content</p>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-left">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="btn btn-outline btn-sm"
              title="Go back"
            >
              ← Back
            </button>
          )}
          <Link to={PAGES.HOME} className="navbar-brand" onClick={toggleSidebar}>
            <span className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5FB0B7" />
                    <stop offset="100%" stopColor="#4A9A9F" />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#brandGradient)"/>
                <path d="M2 17L12 22L22 17" stroke="url(#brandGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#brandGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="brand-text">
              <span className="brand-learning">Learning</span>
              <span className="brand-platform">Platform</span>
            </span>
          </Link>
          <div className="navbar-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="navbar-right">
          <span className="navbar-profile-label">Profile</span>
          <UserButton />
        </div>
      </nav>


      {/* Exit Confirmation Modal */}
      {showExitModal && (

        <div className="modal-overlay" onClick={handleExitCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon modal-icon-warning">⚠️</div>
            <h3 className="modal-title">Exit Quiz?</h3>
            <p className="modal-description">
              Are you sure you want to exit the quiz? Your progress may be lost.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleExitCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleExitConfirm}

                className="btn btn-danger"
>
              
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
