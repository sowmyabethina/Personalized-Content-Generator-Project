import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ingestPdf } from "./rag/ingestPdf.js";
import { getEmbedding } from "./rag/embeddings.js";
import { similaritySearch } from "./rag/vectorStore.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Global error handlers to prevent crashes
process.on("uncaughtException", (err) => {
  console.error(" Uncaught Exception:", err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" Unhandled Rejection at:", promise, "reason:", reason);
});

app.use(cors());
app.use(express.json());

// Health check endpoint - should be first
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    pdfLoaded: currentPdfInfo.ingested,
    fileName: currentPdfInfo.fileName
  });
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/", { recursive: true });
}

const upload = multer({ dest: "uploads/" });

// Store uploaded PDF info
let currentPdfInfo = {
  fileName: null,
  ingested: false
};

// Conversation memory store
const conversationStore = {};

// Clear old uploads on startup
const clearUploads = () => {
  try {
    const files = fs.readdirSync("uploads/");
    for (const file of files) {
      const filePath = fs.join("uploads/", file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    }
    console.log("🧹 Cleared old uploads folder");
  } catch (err) {
    // Ignore errors
  }
};
clearUploads();

// Upload PDF endpoint
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    currentPdfInfo = {
      fileName: req.file.originalname,
      ingested: false
    };

    console.log("📄 Processing PDF:", req.file.originalname);

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF file is too small or empty" });
    }

    await ingestPdf(filePath);
    
    currentPdfInfo.ingested = true;
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log("✅ PDF uploaded and processed successfully");
    
    res.json({ 
      message: "PDF processed & stored in vector DB",
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error("❌ Error uploading PDF:", error.message);
    res.status(500).json({ error: error.message || "Failed to process PDF" });
  }
});

// Ask question endpoint
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!currentPdfInfo.ingested) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    console.log("❓ Question:", question.substring(0, 50) + "...");

    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearch(queryEmbedding, 5);

    if (!results.length) {
      return res.json({ 
        answer: "No relevant information found in the uploaded PDF.",
        sources: []
      });
    }

    // Clean up the answers
    const cleanResults = results.map((r) => {
      const cleanText = r.text
        .replace(/^[^a-zA-Z0-9]+/, "")
        .replace(/\s+/g, " ")
        .trim();
      
      return {
        text: cleanText.substring(0, 500),
        score: r.score
      };
    });

    const answer = cleanResults.map(r => r.text).join("\n\n");

    console.log("✅ Answer generated from", results.length, "chunks");

    res.json({ 
      answer,
      sources: cleanResults
    });
  } catch (error) {
    console.error("❌ Error answering question:", error.message);
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});

// Chat endpoint with conversation memory
app.post("/chat", async (req, res) => {
  try {
    const { question, conversationHistory = [], sessionId } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!currentPdfInfo.ingested) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    // Generate session ID if not provided
    const chatId = sessionId || `chat_${Date.now()}`;

    // Initialize conversation store for this session
    if (!conversationStore[chatId]) {
      conversationStore[chatId] = {
        history: [],
        pdfContext: ""
      };
    }

    // Process conversation history from client
    const clientHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
    
    // Combine with server-side history (take last 10 messages for context)
    const recentHistory = conversationStore[chatId].history.slice(-10);
    
    // Build context from conversation history
    let conversationContext = "";
    if (recentHistory.length > 0) {
      conversationContext = "\nPrevious conversation:\n" + 
        recentHistory.map(h => `User: ${h.question}\nAssistant: ${h.answer}`).join("\n\n");
    }

    // Detect clarification requests
    const clarificationKeywords = [
      "explain more", "give example", "summarize that", "why?",
      "clarify", "expand", "more details", "tell me more"
    ];
    const isClarification = clarificationKeywords.some(kw => 
      question.toLowerCase().includes(kw)
    );

    // Find relevant context from PDF
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearch(queryEmbedding, 8);

    if (!results.length) {
      return res.json({ 
        answer: "This information is not available in the uploaded PDF.",
        sources: [],
        sessionId: chatId
      });
    }

    // Build context from PDF chunks
    const pdfContext = results.map((r, i) => 
      `[Chunk ${i + 1}] ${r.text}`
    ).join("\n\n");

    // For clarifications, expand context
    let expandedContext = pdfContext;
    if (isClarification && conversationContext) {
      // Get more chunks for clarifications
      const clarificationResults = await similaritySearch(queryEmbedding, 15);
      expandedContext = clarificationResults.map((r, i) => 
        `[Chunk ${i + 1}] ${r.text}`
      ).join("\n\n");
    }

    // Combine PDF context and conversation context
    const fullContext = conversationContext ? 
      `${expandedContext}\n${conversationContext}` : 
      expandedContext;

    // Generate answer using Gemini
    let answer = "";
    const topChunks = results.slice(0, 5).map(r => r.text);
    
    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey.length > 0) {
      // Use Gemini to generate answer with strict no-copy rules
      const prompt = `You are a question-answering assistant.

IMPORTANT:
You must NEVER copy sentences directly from the provided context.
You must NEVER include headings, figure labels, chapter numbers, author names, or table of contents text.

Your job is to:
- Read the context silently
- Understand the meaning
- Generate a NEW answer in your own words

STRICT RULES:
- If your answer contains long continuous text from the context, it is WRONG.
- If the answer looks like copied book text, it is WRONG.
- If the answer includes irrelevant sections, it is WRONG.

Answer style:
- Clear explanation
- Simple language
- Short paragraphs
- Human-like explanation (like ChatGPT)

Answer structure:
1. One-line definition
2. Short explanation
3. Optional example (only if useful)

If the context is noisy:
- Ignore noise
- Pick only meaningful sentences
- Rewrite them

If the answer cannot be clearly derived:
- Say: "The document does not clearly explain this topic."

Context from PDF:
${fullContext}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ""}

User's question: ${question}

Please provide a clear, concise, and rewritten answer based on the context above.`;

      try {
        const result = await model.generateContent(prompt);
        answer = result.response.text();
        console.log("✅ Gemini generated answer");
      } catch (geminiError) {
        console.error("❌ Gemini error:", geminiError.message);
        // Fallback to chunk-based answer
        answer = topChunks.join("\n\n");
      }
    } else {
      // No API key - use chunk-based answer (fallback)
      console.log("⚠️ No Gemini API key - using fallback answer");
      answer = topChunks.slice(0, 3).join("\n\n");
    }

    // Clean up the answer
    const cleanAnswer = answer
      .replace(/^[^a-zA-Z0-9]+/, "")
      .replace(/\s+/g, " ")
      .trim();

    // Prepare sources
    const sources = topChunks.slice(0, 3).map((text, i) => ({
      text: text.substring(0, 300) + (text.length > 300 ? "..." : ""),
      score: results[i]?.score?.toFixed(4) || 0
    }));

    // Update conversation history
    conversationStore[chatId].history.push({
      question,
      answer: cleanAnswer,
      timestamp: Date.now()
    });

    // Limit history to last 20 exchanges
    if (conversationStore[chatId].history.length > 20) {
      conversationStore[chatId].history = conversationStore[chatId].history.slice(-20);
    }

    console.log("✅ Chat response generated for session:", chatId);

    res.json({
      answer: cleanAnswer,
      sources,
      sessionId: chatId,
      isClarification
    });

  } catch (error) {
    console.error("❌ Chat error:", error.message);
    res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// Reset endpoint
app.post("/reset", (req, res) => {
  const { sessionId } = req.body;
  
  if (sessionId && conversationStore[sessionId]) {
    // Reset only this conversation
    conversationStore[sessionId] = {
      history: [],
      pdfContext: ""
    };
    res.json({ message: "Conversation reset", sessionId });
  } else {
    // Reset everything
    currentPdfInfo = {
      fileName: null,
      ingested: false
    };
    for (const key in conversationStore) {
      conversationStore[key] = {
        history: [],
        pdfContext: ""
      };
    }
    clearUploads();
    res.json({ message: "Vector store and all conversations reset" });
  }
});

// Info endpoint
app.get("/info", (req, res) => {
  res.json({
    service: "RAG PDF Service",
    version: "1.0.0",
    endpoints: ["/upload-pdf", "/ask", "/health", "/reset"],
    pdfStatus: currentPdfInfo
  });
});

app.listen(PORT, () => {
  console.log(` RAG PDF Service running on port ${PORT}`);
  console.log(`   - POST /upload-pdf - Upload a PDF`);
  console.log(`   - POST /ask - Ask single questions`);
  console.log(`   - POST /chat - Continuous Q&A with memory`);
  console.log(`   - GET /health - Check service status`);
  console.log(`   - POST /reset - Reset vector store or conversation`);
});