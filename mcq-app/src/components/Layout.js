import Navbar from "./Navbar";

function Layout({ children, navbarProps }) {
  return (
    <div className="app-wrapper">
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient-bg">
        <div className="mesh-layer"></div>
        <div className="mesh-orb mesh-orb-1"></div>
        <div className="mesh-orb mesh-orb-2"></div>
        <div className="mesh-orb mesh-orb-3"></div>
      </div>
      
      <Navbar {...navbarProps} />
      {children}
    </div>
  );
}

export default Layout;
