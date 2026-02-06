import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="container">
      <Navbar />
      <div className="header">
        <h1>Personalized Learning Platform</h1>
      </div>
      {children}
    </div>
  );
}

export default Layout;
