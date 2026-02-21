import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

function Navbar({ onBackClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitModal, setShowExitModal] = useState(false);

  const showBackButton = !["/", "/pdf-chat", "/progress", "/about", "/help"].includes(location.pathname);

  const handleBackClick = () => {
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
    <>
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
          <Link to="/" className="navbar-brand">
            Learning Platform
          </Link>
          <div className="navbar-nav">
            {navLinks.map((link) => (
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
