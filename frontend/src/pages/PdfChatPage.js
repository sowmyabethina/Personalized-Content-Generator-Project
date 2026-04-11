import { useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import usePdfStatus from "../hooks/pdfChat/usePdfStatus";
import {
  generateMindMap as generateMindMapRequest,
  resetPdfChat,
  sendPdfChatMessage,
  uploadPdf as uploadPdfRequest,
} from "../services/pdfChat/pdfChatService";
import { convertMindMapToFlowElements } from "../utils/pdfChat/mindMapLayout";

// Inner Flow component that uses ReactFlow hooks
const MindMapFlow = ({ mindMapData }) => {
  const { fitView } = useReactFlow();
  
  // Convert mind map data to flow elements (radial layout)
  const flowData = convertMindMapToFlowElements(mindMapData);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
    setTimeout(() => fitView({ padding: 0.3, duration: 500 }), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindMapData]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      minZoom={0.4}
      maxZoom={1.6}
      panOnScroll
      selectionOnDrag={false}
      defaultEdgeOptions={{
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        type: "smoothstep",
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Background color="#E5E7EB" gap={20} />
      <Controls />
    </ReactFlow>
  );
};

function PdfChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [mindMapData, setMindMapData] = useState(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const { pdfStatus, setPdfStatus } = usePdfStatus();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const uploadPdf = async (file) => {
    setIsLoading(true);
    try {
      const data = await uploadPdfRequest(file);
      if (data) {
        setSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        setMessages([
          {
            id: `msg_${Date.now()}`,
            type: "system",
            content: `✅ PDF "${data.fileName}" uploaded and processed successfully!`,
          },
        ]);
        setPdfStatus({ pdfLoaded: true, fileName: data.fileName });
        setShowChatbot(true);
      } else {
        setMessages([
          {
            id: `msg_${Date.now()}`,
            type: "error",
            content: `❌ Error uploading PDF: ${data.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages([
        {
          id: `msg_${Date.now()}`,
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

    const userMessageId = `msg_${Date.now()}_user`;
    setMessages((prev) => [...prev, { id: userMessageId, type: "user", content: userQuestion }]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const data = await sendPdfChatMessage({
        message: userQuestion,
        sessionId,
        signal: abortControllerRef.current.signal,
      });

      if (data.success) {
        // Log which tool was used for debugging
        console.log("🤖 Agent tool used:", data.tool);
        
        // Extract response from agent - can be in message or data.response
        const responseText = data.message || data.data?.response || "No response";
        
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_assistant`,
            type: "assistant",
            content: responseText,
            sources: data.data?.sources || [],
            isClarification: data.data?.isClarification || false,
            mode: data.tool || "agent",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_error`,
            type: "error",
            content: data.message || data.error || "Failed to get response",
          },
        ]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_error`,
            type: "error",
            content: `❌ Error: ${error.message}`,
          },
        ]);
      }
    }

    setIsLoading(false);
    abortControllerRef.current = null;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateMindMap = async () => {
    if (!pdfStatus?.pdfLoaded || mindMapLoading) return;
    
    setMindMapLoading(true);
    setShowMindMap(true);
    
    try {
      console.log("🧠 Calling mind map generation API...");
      
      // Call mindmap endpoint directly - it fetches text from database
      const data = await generateMindMapRequest();
      setMindMapData(data);
    } catch (error) {
      console.error("Mind map error:", error);
      setMindMapData({ 
        title: 'Error', 
        children: [{ title: error.message, children: [] }] 
      });
    }
    
    setMindMapLoading(false);
  };

  const resetChat = async () => {
    try {
      await resetPdfChat(sessionId);
      setSessionId(null);
      setPdfStatus(null); // Reset to show upload screen
      setShowChatbot(false); // Reset chatbot visibility
      setMessages([
        {
          id: `msg_${Date.now()}`,
          type: "system",
          content: "🔄 Conversation reset. Upload a new PDF to continue.",
        },
      ]);
    } catch (error) {
      console.error("Failed to reset chat:", error);
    }
  };

  // Early return for Mind Map Modal
  if (showMindMap) {
    return (
      <div className="pdf-chat-page-container" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.8)', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="content-wrapper" style={{ 
          maxWidth: '95%', 
          width: '1400px', 
          height: '85vh',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexShrink: 0
          }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🧠 Mind Map</h2>
            <button
              onClick={() => {
                setShowMindMap(false);
                setMindMapData(null);
              }}
              className="btn btn-outline btn-sm"
            >
              ✕ Close
            </button>
          </div>
          
          {mindMapLoading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Generating mind map from your document...</p>
            </div>
          ) : mindMapData ? (
            <div style={{ 
              flex: 1,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}>
              <ReactFlowProvider>
                <MindMapFlow mindMapData={mindMapData} />
              </ReactFlowProvider>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <p>No mind map data available. Click "Generate Mind Map" to create one.</p>
            </div>
          )}
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'var(--color-gray-100)', 
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            flexShrink: 0
          }}>
            💡 Tip: Use controls to zoom/pan. Drag nodes to reposition. Scroll to zoom.
          </div>
        </div>
      </div>
    );
  }

  // If no PDF uploaded yet
  if (!pdfStatus?.pdfLoaded && !showChatbot) {
    return (
      <div className="pdf-chat-page-container">
        <div className="content-wrapper">
          <div className="content-card">
            <h3 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '20px' }}>
              📄 Upload PDF to Start Chatting
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
              Upload a PDF document and ask questions about its content. The system will
              extract relevant information to answer your queries.
            </p>

            <div className="file-input-wrapper" style={{ marginBottom: '20px' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) uploadPdf(file);
                }}
                disabled={isLoading}
              />
            </div>

            {isLoading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="loading-spinner"></div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                  Processing PDF... This may take a moment.
                </p>
              </div>
            )}

            {messages.length > 0 && messages[0].type === "system" && (
              <div className="alert alert-success" style={{ marginTop: '20px' }}>
                <p style={{ marginBottom: '16px' }}>{messages[0].content}</p>
                <button
                  onClick={() => setShowChatbot(true)}
                  className="enterprise-btn"
                >
                  💬 Continue to Chatbot
                </button>
              </div>
            )}
            

          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="pdf-chat-page-container">
      <div className="content-wrapper">
        <div className="content-card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>💬 PDF Chat</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                📄 {pdfStatus?.fileName || "PDF loaded"}
              </span>
              <button
                onClick={resetChat}
                className="btn btn-outline btn-sm"
              >
                🔄 New Chat
              </button>
              <button
                onClick={generateMindMap}
                disabled={mindMapLoading}
                className="btn btn-outline btn-sm"
              >
                {mindMapLoading ? '⏳ Generating...' : '🧠 Mind Map'}
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="chat-section"
            style={{
              height: "400px",
              overflowY: "auto",
              padding: "var(--space-4)",
              background: "var(--color-gray-50)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--space-4)",
              border: "1px solid var(--border-color)",
              maxWidth: "800px",
              margin: "0 auto var(--space-4) auto",
            }}
          >
            {messages.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "100px" }}>
                Ask a question about your PDF to get started...
              </p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: message.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "var(--space-3) var(--space-4)",
                    borderRadius: "var(--radius-xl)",
                    background:
                      message.type === "user"
                        ? "var(--color-primary)"
                        : message.type === "error"
                        ? "var(--color-error-light)"
                        : "var(--color-white)",
                    color: message.type === "user" ? "white" : "var(--text-primary)",
                    border:
                      message.type === "user"
                        ? "none"
                        : message.type === "error"
                        ? "1px solid var(--color-error)"
                        : "1px solid var(--border-color)",
                  }}
                >
                  {message.type === "system" && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      ℹ️ System
                    </span>
                  )}
                  {message.type === "assistant" && message.mode && (
                    <span 
                      style={{ 
                        fontSize: "12px", 
                        display: "inline-block", 
                        marginBottom: "6px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: message.mode === "openai" ? "#e8f5e9" : message.mode === "rag" ? "#e3f2fd" : "#fff3e0",
                        color: message.mode === "openai" ? "#2e7d32" : message.mode === "rag" ? "#1565c0" : "#e65100",
                      }}
                    >
                      {message.mode === "openai" ? "🧠 AI Answer" : message.mode === "rag" ? "📄 From Document" : "⚙️ Offline Mode"}
                    </span>
                  )}
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    background: "var(--color-white)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>⏳ Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div 
            className="chat-section"
            style={{ display: "flex", gap: "12px", marginBottom: '16px', justifyContent: 'center' }}
          >
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your PDF... (Press Enter to send)"
              disabled={isLoading}
              rows={2}
              className="textarea"
              style={{ maxWidth: '600px' }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="enterprise-btn"
              style={{ width: 'auto', padding: '12px 24px', alignSelf: 'center' }}
            >
              ➤ Ask
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
}

export default PdfChatPage;
