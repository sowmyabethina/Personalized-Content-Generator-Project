import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

function Layout({ children }) {
  const location = useLocation();
  const showTitle = location.pathname === "/";

  return (
    <div className="container">
      <Navbar />
      {showTitle && (
        <div className="header">
          <h1>Intelligent Personalized Learning Platform</h1>
        </div>
      )}
      {children}
    </div>
  );
}

export default Layout;
