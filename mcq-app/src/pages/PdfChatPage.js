import { useState, useEffect, useRef, useCallback } from "react";
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

function PdfChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [mindMapData, setMindMapData] = useState(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    checkPdfStatus();
  }, []);

  // Convert JSON tree to markdown for markmap
  const jsonToMarkdown = useCallback((node, level = 0) => {
    if (!node) return '';
    const indent = '  '.repeat(level);
    let md = '';
    
    if (level === 0) {
      md += `# ${node.title}\n`;
    } else {
      md += `${indent}- ${node.title}\n`;
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        md += jsonToMarkdown(child, level + 1);
      }
    }
    
    return md;
  }, []);

  // Render mind map when data changes
  useEffect(() => {
    // Mind map data will be rendered via React components
  }, [mindMapData, showMindMap]);

  // Recursive component to render mind map nodes (OLD - kept for reference)
  // New implementation uses React Flow below
  const MindMapNode = ({ node, isRoot = false }) => {
    if (!node) return null;
    
    return (
      <div style={{ 
        marginLeft: isRoot ? 0 : 20, 
        marginTop: 8 
      }}>
        <div style={{ 
          display: 'inline-block',
          padding: isRoot ? '12px 20px' : '8px 16px',
          background: isRoot ? 'var(--color-primary)' : 'var(--color-white)',
          color: isRoot ? 'white' : 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          border: isRoot ? 'none' : '1px solid var(--border-color)',
          fontWeight: isRoot ? 'bold' : 'normal',
          fontSize: isRoot ? '18px' : '14px',
          boxShadow: isRoot ? 'var(--shadow-md)' : 'var(--shadow-sm)'
        }}>
          {node.title}
        </div>
        {node.children && node.children.length > 0 && (
          <div style={{ 
            borderLeft: '2px solid var(--color-primary)',
            paddingLeft: 16,
            marginTop: 8
          }}>
            {node.children.map((child, index) => (
              <MindMapNode key={index} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Convert mind map data to React Flow nodes and edges with RADIAL layout
  const convertToFlowElements = (data) => {
    if (!data || !data.title) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    let nodeId = 0;
    const generateId = () => `node-${nodeId++}`;

    // Node style
    const nodeStyle = {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "10px 14px",
      color: "#1e293b",
      fontSize: "14px",
      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      width: 180,
      textAlign: "center",
    };

    // Center position
    const centerX = 600;
    const centerY = 350;

    // Root node (center)
    const rootId = "root";
    nodes.push({
      id: rootId,
      type: "input",
      position: { x: centerX, y: centerY },
      data: { label: data.title },
      style: {
        background: "#2563EB",
        color: "white",
        padding: "14px 20px",
        borderRadius: "16px",
        fontWeight: "700",
        fontSize: "18px",
        boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
        width: 200,
        textAlign: "center",
      },
    });

    // Get first level topics
    const topics = data.children || [];

    // Split topics into left and right
    const leftTopics = topics.filter((_, i) => i % 2 === 0);
    const rightTopics = topics.filter((_, i) => i % 2 === 1);

    // Positioning constants
    const horizontalGap = 280;
    const verticalGap = 120;

    // Position right topics
    rightTopics.forEach((topic, i) => {
      const topicId = generateId();
      const yOffset = (i - rightTopics.length / 2) * verticalGap;

      nodes.push({
        id: topicId,
        position: {
          x: centerX + horizontalGap,
          y: centerY + yOffset,
        },
        data: { label: topic.title },
        style: nodeStyle,
      });

      // Edge from root
      edges.push({
        id: `e-root-${topicId}`,
        source: rootId,
        target: topicId,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });

      // Subtopics branching
      if (topic.children && topic.children.length > 0) {
        const childGap = 200;
        topic.children.forEach((child, j) => {
          const childId = generateId();

          nodes.push({
            id: childId,
            position: {
              x: centerX + horizontalGap + childGap,
              y: centerY + yOffset + (j - topic.children.length / 2) * 80,
            },
            data: { label: child.title },
            style: nodeStyle,
          });

          edges.push({
            id: `e-${topicId}-${childId}`,
            source: topicId,
            target: childId,
            type: "smoothstep",
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          });
        });
      }
    });

    // Position left topics
    leftTopics.forEach((topic, i) => {
      const topicId = generateId();
      const yOffset = (i - leftTopics.length / 2) * verticalGap;

      nodes.push({
        id: topicId,
        position: {
          x: centerX - horizontalGap,
          y: centerY + yOffset,
        },
        data: { label: topic.title },
        style: nodeStyle,
      });

      // Edge from root
      edges.push({
        id: `e-root-${topicId}`,
        source: rootId,
        target: topicId,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });

      // Subtopics branching
      if (topic.children && topic.children.length > 0) {
        const childGap = 200;
        topic.children.forEach((child, j) => {
          const childId = generateId();

          nodes.push({
            id: childId,
            position: {
              x: centerX - horizontalGap - childGap,
              y: centerY + yOffset + (j - topic.children.length / 2) * 80,
            },
            data: { label: child.title },
            style: nodeStyle,
          });

          edges.push({
            id: `e-${topicId}-${childId}`,
            source: topicId,
            target: childId,
            type: "smoothstep",
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          });
        });
      }
    });

    return { nodes, edges };
  };

  // Inner Flow component that uses ReactFlow hooks
  const MindMapFlow = ({ mindMapData }) => {
    const { fitView } = useReactFlow();
    
    // Convert mind map data to flow elements (radial layout)
    const flowData = convertToFlowElements(mindMapData);

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
        <Background color="#e2e8f0" gap={20} />
        <Controls />
      </ReactFlow>
    );
  };

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
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
        }

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

  const generateMindMap = async () => {
    if (!pdfStatus?.pdfLoaded || mindMapLoading) return;
    
    setMindMapLoading(true);
    setShowMindMap(true);
    
    try {
      console.log("🧠 Calling mind map generation API...");
      
      // Call mindmap endpoint directly - it fetches text from database
      const res = await fetch("http://localhost:5001/mindmap", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({})
      });
      
      console.log("📥 Mind map response status:", res.status);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate mind map');
      }
      
      const data = await res.json();
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
      await fetch("http://localhost:5001/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setSessionId(null);
      setPdfStatus(null); // Reset to show upload screen
      setShowChatbot(false); // Reset chatbot visibility
      setMessages([
        {
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
      <div className="page-container" style={{ 
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
      <div className="page-container">
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
    <div className="page-container">
      <div className="content-wrapper">
        <div className="content-card">
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
            style={{
              height: "400px",
              overflowY: "auto",
              padding: "var(--space-4)",
              background: "var(--color-gray-50)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--space-4)",
              border: "1px solid var(--border-color)",
            }}
          >
            {messages.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "100px" }}>
                Ask a question about your PDF to get started...
              </p>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
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
          <div style={{ display: "flex", gap: "12px", marginBottom: '16px' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your PDF... (Press Enter to send)"
              disabled={isLoading}
              rows={2}
              className="textarea"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="enterprise-btn"
              style={{ width: 'auto', padding: '12px 24px' }}
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
