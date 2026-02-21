import Navbar from "./Navbar";

function Layout({ children, navbarProps }) {
  return (
    <div className="app-layout">
      <Navbar {...navbarProps} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
