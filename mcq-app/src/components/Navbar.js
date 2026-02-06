import { useNavigate, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = location.pathname !== "/";

  return (
    <div className="top-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#333"
            }}
            title="Go back"
          >
            ← Back
          </button>
        )}
        <h2 style={{ margin: 0 }}>MCQ Generator</h2>
      </div>
      <UserButton />
    </div>
  );
}

export default Navbar;
