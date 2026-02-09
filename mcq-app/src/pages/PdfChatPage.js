import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function PdfChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check PDF status on load
  useEffect(() => {
    checkPdfStatus();
  }, []);

  const checkPdfStatus = async () => {
    try {
      const res = await fetch("http://localhost:5001/health");
      const data = await res.json();
      setPdfStatus(data);
    } catch (error) {
      console.error("Failed to check PDF status:", error);
    }
  };

  const uploadPdf = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("http://localhost:5001/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSessionId(`chat_${Date.now()}`);
        setMessages([
          {
            type: "system",
            content: `✅ PDF "${data.fileName}" uploaded and processed successfully!`,
          },
        ]);
        setPdfStatus({ pdfLoaded: true, fileName: data.fileName });
        // Don't show chatbot yet, show Continue button
      } else {
        setMessages([
          {
            type: "error",
            content: `❌ Error uploading PDF: ${data.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages([
        {
          type: "error",
          content: `❌ Failed to upload PDF: ${error.message}`,
        },
      ]);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userQuestion = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Add user message immediately
    setMessages((prev) => [...prev, { type: "user", content: userQuestion }]);

    try {
      const res = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          conversationHistory: messages.filter((m) => m.type !== "system" && m.type !== "error"),
          sessionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update session ID if new
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Add assistant response
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.answer,
            sources: data.sources || [],
            isClarification: data.isClarification || false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            content: data.error || "Failed to get response",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: `❌ Error: ${error.message}`,
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = async () => {
    try {
      await fetch("http://localhost:5001/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setSessionId(null);
      setMessages([
        {
          type: "system",
          content: "🔄 Conversation reset. Upload a new PDF to continue.",
        },
      ]);
      checkPdfStatus();
    } catch (error) {
      console.error("Failed to reset chat:", error);
    }
  };

  // If no PDF uploaded yet
  if (!pdfStatus?.pdfLoaded && !showChatbot) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/quiz")}
          style={{ marginBottom: "20px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "10px 20px", cursor: "pointer", borderRadius: "8px", color: "#374151", fontSize: "14px", fontWeight: "500" }}
        >
          ← Back to Assessment
        </button>

        <h3>📄 Upload PDF to Start Chatting</h3>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Upload a PDF document and ask questions about its content. The system will
          extract relevant information to answer your queries.
        </p>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) uploadPdf(file);
          }}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "20px",
            border: "2px dashed #d1d5db",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        />

        {isLoading && (
          <p style={{ color: "#6b7280", marginTop: "10px" }}>
            Processing PDF... This may take a moment.
          </p>
        )}

        {/* Show success message and Continue button */}
        {messages.length > 0 && messages[0].type === "system" && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#dcfce7",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#166534", marginBottom: "15px" }}>{messages[0].content}</p>
            <button
              onClick={() => setShowChatbot(true)}
              style={{
                padding: "12px 30px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              💬 Continue to Chatbot
            </button>
          </div>
        )}

        <div style={{ marginTop: "20px", padding: "15px", background: "#f3f4f6", borderRadius: "8px" }}>
          <h4 style={{ marginTop: 0 }}>💡 Tips</h4>
          <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
            <li>Upload a resume, research paper, or technical document</li>
            <li>Ask specific questions about the content</li>
            <li>Use follow-up questions like "explain more" or "give examples"</li>
            <li>The system remembers your conversation context</li>
          </ul>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/quiz")}
        style={{ marginBottom: "15px", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", color: "#374151", fontSize: "14px", fontWeight: "500" }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0 }}>💬 PDF Chat</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            📄 {pdfStatus?.fileName || "PDF loaded"}
          </span>
          <button
            onClick={resetChat}
            style={{
              padding: "6px 12px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          padding: "15px",
          background: "#f9fafb",
          borderRadius: "8px",
          marginBottom: "15px",
          border: "1px solid #e5e7eb",
        }}
      >
        {messages.length === 0 && (
          <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "100px" }}>
            Ask a question about your PDF to get started...
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              display: "flex",
              flexDirection: "column",
              alignItems: message.type === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "12px",
                background:
                  message.type === "user"
                    ? "#2563eb"
                    : message.type === "error"
                    ? "#fef2f2"
                    : "#ffffff",
                color: message.type === "user" ? "white" : "#1f2937",
                border:
                  message.type === "user"
                    ? "none"
                    : message.type === "error"
                    ? "1px solid #fecaca"
                    : "1px solid #e5e7eb",
              }}
            >
              {message.type === "system" && (
                <span style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "5px" }}>
                  ℹ️ System
                </span>
              )}
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{message.content}</div>

              {/* Show sources for assistant messages */}
              {message.type === "assistant" && message.sources?.length > 0 && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 5px 0" }}>
                    📎 Sources:
                  </p>
                  {message.sources.map((source, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        margin: "2px 0",
                        fontStyle: "italic",
                      }}
                    >
                      {source.text.substring(0, 100)}...
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <span style={{ color: "#6b7280" }}>⏳ Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ display: "flex", gap: "10px" }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your PDF... (Press Enter to send)"
          disabled={isLoading}
          rows={2}
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            resize: "none",
            fontSize: "14px",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          style={{
            padding: "12px 24px",
            background: isLoading || !inputMessage.trim() ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          Send
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "#6b7280" }}>Quick questions:</span>
        {[
          "Summarize this PDF",
          "What are the key points?",
          "Explain more about this",
          "Give examples",
        ].map((q) => (
          <button
            key={q}
            onClick={() => setInputMessage(q)}
            disabled={isLoading}
            style={{
              padding: "4px 10px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PdfChatPage;
