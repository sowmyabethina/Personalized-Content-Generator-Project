import { useState } from "react";
import "../styles/PdfChatPage.css";

function PdfChatPage() {
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUploadPDF = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      console.log("Uploading PDF to RAG service...");
      const response = await fetch("http://localhost:5001/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Upload failed: ${response.status}`);
        } catch (e) {
          throw new Error(`Upload failed: ${response.status}. Make sure the RAG service is running on port 5001`);
        }
      }

      const data = await response.json();
      setIsUploaded(true);
      setChatHistory([]);
      setQuestion("");
      setAnswer("");
      console.log("PDF uploaded successfully!");
      alert("PDF uploaded successfully! You can now ask questions.");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload PDF. Make sure the RAG service is running on port 5001.");
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    if (!isUploaded) {
      setError("Please upload a PDF first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5001/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Query failed:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Query failed: ${response.status}`);
        } catch (e) {
          throw new Error(`Query failed: ${response.status}. Make sure the RAG service is running on port 5001`);
        }
      }

      const data = await response.json();
      const newChat = {
        question,
        answer: data.answer || "No answer found",
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatHistory([...chatHistory, newChat]);
      setAnswer(data.answer || "No answer found");
      setQuestion("");
    } catch (err) {
      setError(err.message || "Failed to get answer");
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsUploaded(false);
    setQuestion("");
    setAnswer("");
    setChatHistory([]);
    setError("");
  };

  return (
    <div className="pdf-chat-container">
      <h1>📄 PDF Chat - Ask Questions About Your Documents</h1>

      <div className="pdf-chat-content">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Step 1: Upload Your PDF</h2>
          <div className="upload-area">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isUploaded}
              id="pdf-input"
            />
            <label htmlFor="pdf-input" className="file-label">
              {file ? `Selected: ${file.name}` : "Click to select a PDF file"}
            </label>
          </div>

          {!isUploaded ? (
            <button
              onClick={handleUploadPDF}
              disabled={!file || uploading}
              className="btn-primary"
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          ) : (
            <div className="success-message">
              ✅ PDF uploaded successfully: {file.name}
            </div>
          )}
        </div>

        {/* Chat Section */}
        {isUploaded && (
          <div className="chat-section">
            <h2>Step 2: Ask Questions</h2>

            <div className="question-input-area">
              <textarea
                placeholder="Ask a question about the PDF content..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleAskQuestion();
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="btn-primary"
              >
                {loading ? "Getting Answer..." : "Ask Question"}
              </button>
            </div>

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="chat-history">
                <h3>Conversation History</h3>
                {chatHistory.map((chat, index) => (
                  <div key={index} className="chat-exchange">
                    <div className="question-box">
                      <strong>Q:</strong> {chat.question}
                      <span className="timestamp">{chat.timestamp}</span>
                    </div>
                    <div className="answer-box">
                      <strong>A:</strong> {chat.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="reset-area">
              <button onClick={handleReset} className="btn-secondary">
                Upload New PDF
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default PdfChatPage;
