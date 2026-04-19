import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });
import Groq from "groq-sdk";
import { logAgentEvent } from "./agentMonitor.js";
const { ingestPdf } = await import("./rag/ingestPdf.js");
const { getEmbedding } = await import("./rag/embeddings.js");
const {
  similaritySearchWithThreshold,
  initVectorStore,
  getChunkCount,
} = await import("./rag/vectorStore.js");

const app = express();
const PORT = process.env.PORT || 5001;
const INCLUDE_SOURCES = process.env.INCLUDE_SOURCES !== 'false';

// Initialize Groq - validate API key exists
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

if (!groq) {
  console.warn("WARNING: GROQ_API_KEY not set. Using fallback mode.");
}

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const RAG_CORS_ORIGIN = process.env.CORS_ORIGIN || true; // Allow all by default
app.use(cors({
  origin: RAG_CORS_ORIGIN
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const chunkCount = await getChunkCount();
    const pdfInfo = currentPdfInfo;
    res.json({ 
      status: "ok",
      pdfLoaded: chunkCount > 0,
      chunkCount: chunkCount,
      fileName: pdfInfo?.fileName || null
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

// Multer configuration with PDF file type validation
const upload = multer({ 
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  }
});

// Store uploaded PDF info
let currentPdfInfo = {
  fileName: null,
  pdfId: null,
  ingested: false
};

// Conversation memory store
const conversationStore = {};

// Rate limiting
let lastLlmCallTime = 0;
const LLM_CALL_INTERVAL = 3000;

const requestCache = new Map();
const CACHE_TTL = 20000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, 60000);

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

const TUTOR_PROMPT = `You are a helpful academic tutor.
Answer ONLY using the provided context.
If the answer is partially available, explain using the available text.
Do NOT say "information not found" unless context is completely empty.`;

const FALLBACK_MODEL = "llama-3.1-8b-instant";

async function generateAnswer(context, question, history = []) {
  const messages = [
    { role: "system", content: TUTOR_PROMPT },
    { role: "system", content: `Context from PDF document:\n${context.substring(0, 4000)}` },
    { role: "user", content: `Question: ${question}` }
  ];

  history.forEach(h => {
    messages.push({ role: "user", content: h.question });
    messages.push({ role: "assistant", content: h.answer });
  });

  // Check if Groq is configured
  if (!groq) {
    return {
      answer: generateFallbackAnswer(context, question),
      isFallback: true
    };
  }

  try {
    logAgentEvent("GROQ_CALL_STARTED");
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024
    });
    
    logAgentEvent("GROQ_SUCCESS");
    
    return {
      answer: completion.choices[0]?.message?.content || "No response generated.",
      isFallback: false
    };
  } catch (primaryError) {
    console.error('❌ Groq generateAnswer error:', primaryError.message);
    logAgentEvent("GROQ_FALLBACK_TRIGGERED", primaryError.message);
    
    // Try fallback model
    try {
      console.log("Primary model failed, trying fallback:", FALLBACK_MODEL);
      const fallbackCompletion = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1024
      });
      
      return {
        answer: fallbackCompletion.choices[0]?.message?.content || "No response generated.",
        isFallback: false
      };
    } catch (fallbackError) {
      console.error('❌ Fallback model also failed:', fallbackError.message);
      logAgentEvent("FALLBACK_TRIGGERED", fallbackError.message);
      return {
        answer: generateFallbackAnswer(context, question),
        isFallback: true
      };
    }
  }
}

/**
 * Fallback answer generator - provides rule-based responses when Groq fails
 * @param {string} context - Retrieved context from PDF
 * @param {string} question - User's question
 * @returns {string} Fallback answer
 */
function generateFallbackAnswer(context, question) {
  // Extract key sentences from context that might be relevant to the question
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const lowerQuestion = question.toLowerCase();
  
  // Find relevant sentences
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    // Check for keyword overlap
    const questionWords = lowerQuestion.split(/\s+/).filter(w => w.length > 3);
    return questionWords.some(word => lowerSentence.includes(word));
  });
  
  if (relevantSentences.length > 0) {
    // Return relevant content from the PDF
    const answer = relevantSentences.slice(0, 3).join('. ') + '.';
    return `Based on the document, here's what I found:\n\n${answer}\n\n*Note: I'm currently operating in offline mode with limited capabilities. The above is extracted from the PDF content.*`;
  }
  
  // Default fallback
  return `I found relevant content in the document but cannot process it with AI right now due to API limitations.\n\nFrom the document:\n${context.substring(0, 500)}...\n\n*Note: I'm currently operating in offline mode. Please try again later for full AI-powered answers.*`;
}

// Upload PDF endpoint
app.post("/upload-pdf", (req, res, next) => {
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload failed" });
    }
    next();
  });
}, async (req, res) => {
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

    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "PDF file is too small or empty" });
    }

    const result = await ingestPdf(filePath);
    
    currentPdfInfo.pdfId = result.pdfId;
    currentPdfInfo.ingested = true;
    
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

// Ask question endpoint - uses existing vector search from database
app.post("/ask", async (req, res) => {
  try {
    const { question, similarityThreshold = 0.05 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    console.log("❓ Question:", question.substring(0, 50) + "...");

    const cacheKey = getRequestCacheKey(question, 'global');
    const cachedEntry = requestCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      console.log(`⚡ Returning cached response for: "${question.substring(0, 30)}..."`);
      return res.json({
        ...cachedEntry.response,
        cached: true
      });
    }

    // Use database vector search (existing implementation)
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 3, similarityThreshold);

    if (!results.length) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF. Please try rephrasing your question."
      };
      if (INCLUDE_SOURCES) noAnswerResponse.sources = [];
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastLlmCallTime = now;

    // Build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, 3);
    
    console.log(`📚 Building context from ${topChunks.length} chunks`);
    
    const MAX_WORDS = 1500;
    let context = "";
    let wordCount = 0;
    for (const chunk of topChunks) {
      const chunkText = chunk.text || chunk.chunk_text;
      
      if (!chunkText) {
        console.warn('⚠️ Skipping chunk with no text:', chunk);
        continue;
      }
      
      const chunkWords = chunkText.split(/\s+/).length;
      if (wordCount + chunkWords <= MAX_WORDS) {
        context += (context ? "\n\n---\n\n" : "") + chunkText;
        wordCount += chunkWords;
      } else {
        break;
      }
    }

    // If context is empty, return error
    if (!context || context.trim() === '') {
      console.error('❌ No context could be built from chunks');
      return res.status(400).json({ 
        error: 'No retrievable content found in PDF chunks' 
      });
    }

    console.log(`📝 Context built: ${context.length} characters, ${wordCount} words`);

    const answer = await generateAnswer(context, question);

    const sources = topChunks.map((r) => ({
      text: (r.text || r.chunk_text).substring(0, 200) + "...",
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for question:", question.substring(0, 30) + "...");

    const responseData = { answer };
    if (INCLUDE_SOURCES) responseData.sources = sources;

    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error answering question:", error.message);
    // Don't return HTTP 500 - use fallback response instead
    console.log("Groq unavailable — using fallback answer");
    const fallbackAnswer = "I'm currently operating in offline mode. " +
      "I found relevant content in the document but cannot process it with AI right now. " +
      "Please try again later for full AI-powered answers.";
    res.json({ 
      answer: fallbackAnswer,
      isFallback: true,
      sources: []
    });
  }
});

// Chat endpoint - uses existing vector search from database
app.post("/chat", async (req, res) => {
  const startTime = Date.now();
  let mode = "unknown";
  let chatId = `chat_${Date.now()}`; // Default fallback
  
  try {
    const {
      question: rawQuestion,
      message: rawMessage,
      conversationHistory = [],
      sessionId,
      similarityThreshold = 0.05
    } = req.body;

    const question = (rawQuestion || rawMessage || '').trim();

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    
    // Log user message received
    logAgentEvent("USER_MESSAGE_RECEIVED", question.substring(0, 50) + "...");

    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    chatId = sessionId || chatId;

    if (!conversationStore[chatId]) {
      conversationStore[chatId] = {
        history: [],
        pdfContext: ""
      };
    }

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

    // Use database vector search (existing implementation)
    logAgentEvent("RAG_SEARCH_STARTED");
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 3, similarityThreshold);
    logAgentEvent("RAG_RESULTS_FOUND", results.length + " chunks");

    if (!results || results.length === 0) {
      const noAnswerResponse = {
        answer: "I couldn't find any relevant information in the uploaded PDF to answer your question. Please try rephrasing or asking about something specific in the document."
      };
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        response: noAnswerResponse
      });
      return res.json(noAnswerResponse);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastLlmCallTime;
    if (timeSinceLastCall < LLM_CALL_INTERVAL) {
      const waitTime = LLM_CALL_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before LLM call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastLlmCallTime = Date.now();

    // Build context
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const topChunks = sortedResults.slice(0, 3);
    
    console.log(`📚 Building context from ${topChunks.length} chunks`);
    
    const MAX_WORDS = 1500;
    let context = "";
    let wordCount = 0;
    for (const chunk of topChunks) {
      const chunkText = chunk.text || chunk.chunk_text;
      
      if (!chunkText) {
        console.warn('⚠️ Skipping chunk with no text:', chunk);
        continue;
      }
      
      const chunkWords = chunkText.split(/\s+/).length;
      if (wordCount + chunkWords <= MAX_WORDS) {
        context += (context ? "\n\n---\n\n" : "") + chunkText;
        wordCount += chunkWords;
      } else {
        break;
      }
    }

    // If context is empty, return error
    if (!context || context.trim() === '') {
      console.error('❌ No context could be built from chunks');
      return res.status(400).json({ 
        error: 'No retrievable content found in PDF chunks' 
      });
    }

    console.log(`📝 Context built: ${context.length} characters, ${wordCount} words`);

    const answerResult = await generateAnswer(context, question, conversationHistory);
    const answer = answerResult.answer;
    const isFallback = answerResult.isFallback;
    
    // Set the mode based on whether fallback was used
    mode = isFallback ? "rule-based" : "groq";

    const sources = topChunks.map((r) => ({
      text: (r.text || r.chunk_text).substring(0, 200) + "...",
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for chat question:", question.substring(0, 30) + "...");

    const responseData = { answer, sessionId: chatId };
    if (INCLUDE_SOURCES) responseData.sources = sources;
    if (isFallback) responseData.isFallback = true;
    responseData.mode = mode;

    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    // Log response time and mode before sending
    const responseTime = Date.now() - startTime;
    logAgentEvent("RESPONSE_TIME", responseTime + "ms");
    logAgentEvent("RESPONSE_MODE", mode);
    
    res.json(responseData);
  } catch (error) {
    console.error("❌ Error in chat endpoint:", error.message);
    // Don't return HTTP 500 - use fallback response instead
    console.log("Groq unavailable — using fallback answer");
    logAgentEvent("FALLBACK_TRIGGERED", error.message);
    mode = "rule-based";
    
    const fallbackAnswer = "I'm currently operating in offline mode. " +
      "I found relevant content in the document but cannot process it with AI right now. " +
      "Please try again later for full AI-powered answers.";
    
    // Log response time and mode before sending
    const responseTime = Date.now() - startTime;
    logAgentEvent("RESPONSE_TIME", responseTime + "ms");
    logAgentEvent("RESPONSE_MODE", mode);
    
    res.json({ 
      answer: fallbackAnswer,
      isFallback: true,
      sessionId: chatId,
      sources: [],
      mode: mode
    });
  }
});

// Reset conversation endpoint
app.post("/reset", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId && conversationStore[sessionId]) {
      delete conversationStore[sessionId];
    }
    
    res.json({ message: "Conversation reset successfully" });
  } catch (error) {
    console.error("❌ Error resetting conversation:", error.message);
    res.status(500).json({ error: "Failed to reset conversation" });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await initVectorStore();
    console.log("Connected to PostgreSQL for vector storage");
    
    clearUploads();
    
    // Simple global error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({
        error: "Something went wrong"
      });
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
 