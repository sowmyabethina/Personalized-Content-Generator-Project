import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import ResultPage from "./pages/ResultPage";
import LearningPage from "./pages/LearningPage";
import PdfChatPage from "./pages/PdfChatPage";
import "./App.css";

function App() {
  return (
      <div className="container">
        {/* Logged Out */}
        <SignedOut>
          <div className="login-box">
            <h2>Login to Continue</h2>
            <SignIn />
          </div>
        </SignedOut>

        {/* Logged In */}
        <SignedIn>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/assessment" element={<LearningPage />} />
              <Route path="/pdf-chat" element={<PdfChatPage />} />
            </Routes>
          </Layout>
        </SignedIn>
      </div>
  );
}

export default App;