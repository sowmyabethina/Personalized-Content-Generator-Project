import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ingestPdf } from "./rag/ingestPdf.js";
import { getEmbedding } from "./rag/embeddings.js";
import { 
  similaritySearch, 
  similaritySearchWithThreshold, 
  initVectorStore,
  getChunkCount,
  clearVectorStore
} from "./rag/vectorStore.js";

// Initialize Gemini for Q&A

// General Q&A prompt - works for all question types
const QA_PROMPT = `
You are a helpful assistant answering questions about a document.

Your task:
1. Read the provided context carefully
2. Answer the user's question based ONLY on the context
3. If the context doesn't contain enough information, say "I don't have enough information in the document to answer this question."
4. Be concise but thorough
5. If answering from the document, include relevant details

Context from document:
{context}

User's question: {question}

Answer:
`;

// Follow-up question prompt that uses conversation history
const FOLLOWUP_PROMPT = `
You are a helpful assistant answering questions about a document.

Conversation history:
{history}

Context from document:
{context}

User's follow-up question: {question}

Answer based on the conversation and context:
`;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const chunkCount = await getChunkCount();
    res.json({ 
      status: "ok",
      pdfLoaded: chunkCount > 0,
      chunkCount: chunkCount
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error",
      message: error.message 
    });
  }
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/", { recursive: true });
}

const upload = multer({ dest: "uploads/" });

// Store uploaded PDF info (now tracking PDF ID for database)
let currentPdfInfo = {
  fileName: null,
  pdfId: null,
  ingested: false
};

// Conversation memory store
const conversationStore = {};

// ===============================
// RATE LIMITING & REQUEST DEDUPLICATION
// ===============================
// Track last LLM call timestamp for rate limiting
let lastLlmCallTime = 0;
const LLM_CALL_INTERVAL = 3000; // 3 seconds between LLM calls

// Cache for duplicate request prevention (20 seconds TTL)
const requestCache = new Map();
const CACHE_TTL = 20000; // 20 seconds

// Clean up expired cache entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, 60000);

// Function to generate cache key for a question
function getRequestCacheKey(question, chatId) {
  return `${chatId}:${question.toLowerCase().trim()}`;
}

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

// Generate answer using LLM with the provided context
async function generateAnswer(context, question, history = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt;
    if (history && history.length > 0) {
      // Format conversation history
      const historyText = history
        .map(h => `Q: ${h.question}\nA: ${h.answer}`)
        .join("\n\n");
      prompt = FOLLOWUP_PROMPT
        .replace("{history}", historyText)
        .replace("{context}", context)
        .replace("{question}", question);
    } else {
      prompt = QA_PROMPT
        .replace("{context}", context)
        .replace("{question}", question);
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let answer = response.text().trim();
    
    // Clean up any residual formatting
    answer = answer
      .replace(/^["']|["']$/g, "")
      .replace(/^[-•*]\s*/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    
    return answer || "I couldn't find a clear answer in the document.";
  } catch (error) {
    console.error("❌ LLM answer generation error:", error.message);
    throw error;
  }
}

// Upload PDF endpoint
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    currentPdfInfo = {
      fileName: req.file.originalname,
      pdfId: null,
      ingested: false
    };

    console.log("📄 Processing PDF:", req.file.originalname);

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF file is too small or empty" });
    }

    // Ingest PDF and store in PostgreSQL
    const result = await ingestPdf(filePath);
    
    currentPdfInfo.pdfId = result.pdfId;
    currentPdfInfo.ingested = true;
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log("✅ PDF uploaded and processed successfully");
    
    res.json({ 
      message: "PDF processed & stored in PostgreSQL database",
      fileName: req.file.originalname,
      pdfId: result.pdfId,
      chunkCount: result.chunkCount
    });
  } catch (error) {
    console.error("❌ Error uploading PDF:", error.message);
    res.status(500).json({ error: error.message || "Failed to process PDF" });
  }
});

// Ask question endpoint - uses vector search + LLM Q&A (single LLM call only)
app.post("/ask", async (req, res) => {
  try {
    const { question, similarityThreshold = 0.25 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Check if any PDFs are loaded
    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    console.log("❓ Question:", question.substring(0, 50) + "...");

    // Check for duplicate request
    const cacheKey = getRequestCacheKey(question, 'global');
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`⚡ Returning cached response for: "${question.substring(0, 30)}..."`);
      return res.json({
        ...cachedEntry.response,
        cached: true
      });
    }

    // Step 1: Vector retrieval with similarity threshold
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 10, similarityThreshold);

    // If no relevant results found, return immediately without LLM call
    if (!results.length) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF. Please try rephrasing your question.",
        sources: []
      };
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Step 2: Apply rate limiting - wait if needed before LLM call
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Update last call timestamp
    lastLlmCallTime = now;

    // Step 3: Prioritize high-similarity chunks and build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, 5);
    const context = topChunks.map(r => r.text).join("\n\n---\n\n");

    // Step 4: Generate answer using LLM (SINGLE CALL)
    const answer = await generateAnswer(context, question);

    // Step 5: Prepare sources (sorted by relevance)
    const sources = topChunks.map((r) => ({
      text: r.text.substring(0, 200) + (r.text.length > 200 ? "..." : ""),
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for question:", question.substring(0, 30) + "...");

    const responseData = { answer, sources };
    
    // Cache the response
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error answering question:", error.message);
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});

// ===============================
// CHAT ENDPOINT - WITH RATE LIMITING & DEDUPLICATION
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { question, conversationHistory = [], sessionId, similarityThreshold = 0.25 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Check if any PDFs are loaded
    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
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

    // Check for duplicate request (same question within 20 seconds)
    const cacheKey = getRequestCacheKey(question, chatId);
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`⚡ Returning cached response for: "${question.substring(0, 30)}..."`);
      return res.json({
        ...cachedEntry.response,
        cached: true,
        sessionId: chatId
      });
    }

    // Detect clarification requests
    const clarificationKeywords = [
      "explain more", "give example", "summarize that", "why?",
      "clarify", "expand", "more details", "tell me more"
    ];
    const isClarification = clarificationKeywords.some(kw => 
      question.toLowerCase().includes(kw)
    );

    console.log("❓ Chat question:", question.substring(0, 50) + "...");

    // Step 1: Vector retrieval with similarity threshold
    const queryEmbedding = await getEmbedding(question);
    const numResults = isClarification ? 15 : 10;
    const results = await similaritySearchWithThreshold(queryEmbedding, numResults, similarityThreshold);

    // If no relevant results found, return immediately without LLM call
    if (!results.length) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF. Please try rephrasing your question.",
        sources: [],
        sessionId: chatId,
        isClarification
      };
      // Cache the no-result response too
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Step 2: Apply rate limiting - wait if needed before LLM call
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Update last call timestamp
    lastLlmCallTime = now;


    // Step 3: Prioritize high-similarity chunks and build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, isClarification ? 8 : 5);
    const context = topChunks.map(r => r.text).join("\n\n---\n\n");


    // Step 4: Generate answer using LLM with conversation history (SINGLE CALL)
    const answer = await generateAnswer(context, question, conversationStore[chatId].history);

    // Step 5: Prepare sources
    const sources = topChunks.map((r) => ({
      text: r.text.substring(0, 200) + (r.text.length > 200 ? "..." : ""),
      score: r.score?.toFixed(4) || 0
    }));

    // Update conversation history
    conversationStore[chatId].history.push({
      question,
      answer,
      timestamp: Date.now()
    });
    if (conversationStore[chatId].history.length > 20) {
      conversationStore[chatId].history = conversationStore[chatId].history.slice(-20);
    }

    console.log("✅ Answer generated for chat session:", chatId);

    const responseData = {
      answer,
      sources,
      sessionId: chatId,
      isClarification
    };

    // Cache the successful response
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    res.json(responseData);

  } catch (error) {
    console.error("❌ Chat error:", error.message);
    res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// Reset endpoint
app.post("/reset", async (req, res) => {
  const { sessionId, pdfId } = req.body;
  
  if (sessionId && conversationStore[sessionId]) {
    // Reset only this conversation
    conversationStore[sessionId] = {
      history: [],
      pdfContext: ""
    };
    res.json({ message: "Conversation reset", sessionId });
  } else if (pdfId) {
    // Reset only vectors for this PDF
    await clearVectorStore(pdfId);
    currentPdfInfo = {
      fileName: null,
      pdfId: null,
      ingested: false
    };
    res.json({ message: `Vector store reset for PDF: ${pdfId}` });
  } else {
    // Reset everything
    await clearVectorStore();
    currentPdfInfo = {
      fileName: null,
      pdfId: null,
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
app.get("/info", async (req, res) => {
  try {
    const chunkCount = await getChunkCount();
    res.json({
      service: "RAG PDF Service",
      version: "2.0.0",
      database: "PostgreSQL",
      endpoints: ["/upload-pdf", "/ask", "/chat", "/health", "/reset"],
      status: {
        chunksStored: chunkCount,
        currentPdf: currentPdfInfo
      }
    });
  } catch (error) {
    res.json({
      service: "RAG PDF Service",
      version: "2.0.0",
      database: "PostgreSQL",
      error: error.message
    });
  }
});

// Graceful shutdown
async function shutdown() {
  console.log("\n🛑 Shutting down RAG PDF Service...");
  try {
    const { closeVectorStore } = await import("./rag/vectorStore.js");
    await closeVectorStore();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server after initializing vector store
async function startServer() {
  try {
    // Initialize database connection
    console.log("🔄 Initializing PostgreSQL connection...");
    await initVectorStore();
    
    clearUploads();
    
    app.listen(PORT, () => {
      console.log(` RAG PDF Service v2.0 running on port ${PORT}`);
      console.log(`   - POST /upload-pdf - Upload a PDF`);
      console.log(`   - POST /ask - Ask single questions`);
      console.log(`   - POST /chat with memory`);
      console.log(`   - Continuous Q&A - GET /health - Check service status`);
      console.log(`   - POST /reset - Reset vector store or conversation`);
      console.log(`   - GET /info - Service information`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
