import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = !["/", "/quiz", "/assessment", "/pdf-chat", "/progress"].includes(location.pathname);

  const navLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/quiz", label: "Quiz", icon: "📝" },
    { path: "/assessment", label: "Assessment", icon: "📊" },
    { path: "/pdf-chat", label: "PDF Chat", icon: "📄" },
    { path: "/progress", label: "Progress", icon: "📈" },
  ];

  return (
    <nav style={{
      background: "#ffffff",
      padding: "15px 30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#667eea",
              border: "none",
              fontSize: "14px",
              cursor: "pointer",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px"
            }}
            title="Go back"
          >
            ← Back
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#333" }}>
          🎓 Learning Platform
        </h2>
        <nav style={{ display: "flex", gap: "8px", marginLeft: "20px" }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: location.pathname === link.path ? "underline" : "none",
                color: location.pathname === link.path ? "#667eea" : "#555",
                fontWeight: location.pathname === link.path ? "bold" : "normal",
                fontSize: "14px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: location.pathname === link.path ? "rgba(102, 126, 234, 0.1)" : "transparent"
              }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "14px", color: "#666" }}>Profile</span>
        <UserButton />
      </div>
    </nav>
  );
}

export default Navbar;
