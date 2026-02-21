import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import { ingestPdf } from "./rag/ingestPdf.js";
import { getEmbedding } from "./rag/embeddings.js";
import { 
  similaritySearch, 
  similaritySearchWithThreshold, 
  initVectorStore,
  getChunkCount,
  clearVectorStore,
  getSequentialChunks,
  getAllChunkTexts,
  getChunksByPdfId
} from "./rag/vectorStore.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const INCLUDE_SOURCES = process.env.INCLUDE_SOURCES !== 'false';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error(" Uncaught Exception:", err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" Unhandled Rejection at:", promise, "reason:", reason);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Mind Map Generation - Uses existing database chunks
app.post("/mindmap", async (req, res) => {
  console.log("🧠 Mind map generation API called");
  
  try {
    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      console.log("⚠️ No PDF uploaded");
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    console.log(`📚 Total chunks in DB: ${chunkCount}`);

    // Get all chunk texts from the database
    const allTexts = await getAllChunkTexts();
    
    if (!allTexts || allTexts.length === 0) {
      return res.status(400).json({ error: 'No content found in PDF' });
    }

    // Combine all text
    const fullText = allTexts.map(t => t.text).join('\n\n');
    console.log(`📄 Total text length: ${fullText.length} characters`);

    // Use similarity search to get diverse chunks for mind map
    const queryText = "main topics chapters concepts syllabus learning";
    const queryEmbedding = await getEmbedding(queryText);
    
    // Get top chunks with low threshold to get more content
    const results = await similaritySearchWithThreshold(queryEmbedding, 20, 0.10);
    
    console.log(`🔍 Retrieved ${results.length} chunks for mind map`);
    
    if (results.length === 0) {
      return res.status(400).json({ error: 'No relevant content found in PDF' });
    }

    // Extract headings and topics from retrieved chunks
    const topics = extractTopicsFromChunks(results);
    
    console.log("✅ Generated Mind Map:", JSON.stringify(topics).substring(0, 300) + "...");
    
    res.json(topics);
  } catch (error) {
    console.error('Mind map generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate mind map' 
    });
  }
});

/**
 * Extract topics from chunks for mind map
 */
function extractTopicsFromChunks(results) {
  // Get unique headings from chunks
  const headingMap = new Map();
  const allContent = [];
  
  for (const result of results) {
    const text = result.text || result.chunk_text;
    const heading = result.title || result.section_title;
    
    if (heading) {
      if (!headingMap.has(heading)) {
        headingMap.set(heading, []);
      }
    }
    allContent.push(text);
  }
  
  // Build mind map structure
  const fullText = allContent.join(' ');
  
  // Extract key phrases
  const phrases = extractKeyPhrasesSimple(fullText);
  
  // Determine root title from first chunk
  let rootTitle = "Document Overview";
  if (results.length > 0) {
    const firstText = results[0].text || results[0].chunk_text;
    const firstHeading = results[0].title || results[0].section_title;
    if (firstHeading) {
      rootTitle = firstHeading;
    } else if (firstText) {
      rootTitle = firstText.split(/\s+/).slice(0, 4).join(' ');
    }
  }
  
  // Group phrases into categories
  const categories = groupPhrasesSimple(phrases);
  
  return {
    title: rootTitle,
    children: categories
  };
}

/**
 * Simple key phrase extraction
 */
function extractKeyPhrasesSimple(text) {
  const phraseMap = new Map();
  
  // Extract bigrams
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + ' ' + words[i + 1];
    if (isValidKeyPhrase(bigram)) {
      phraseMap.set(bigram, (phraseMap.get(bigram) || 0) + 1);
    }
  }
  
  // Extract trigrams
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
    if (isValidKeyPhrase(trigram)) {
      phraseMap.set(trigram, (phraseMap.get(trigram) || 0) + 1);
    }
  }
  
  // Sort by frequency and return top phrases
  return Array.from(phraseMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase]) => phrase);
}

/**
 * Check if phrase is valid
 */
function isValidKeyPhrase(phrase) {
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on',
    'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'and', 'or', 'but', 'if', 'while', 'because'];
  
  const words = phrase.toLowerCase().split(/\s+/);
  const contentWords = words.filter(w => !stopWords.includes(w) && w.length > 2);
  return contentWords.length >= 1;
}

/**
 * Group phrases into categories
 */
function groupPhrasesSimple(phrases) {
  const categories = [];
  const used = new Set();
  
  // Create categories from top phrases
  for (const phrase of phrases) {
    if (used.has(phrase)) continue;
    
    used.add(phrase);
    
    const category = {
      title: phrase,
      children: []
    };
    
    // Find related sub-phrases
    for (const other of phrases) {
      if (used.has(other)) continue;
      
      // Check for common words
      const words1 = phrase.toLowerCase().split(/\s+/);
      const words2 = other.toLowerCase().split(/\s+/);
      const common = words1.filter(w => words2.includes(w));
      
      if (common.length > 0) {
        category.children.push({ title: other, children: [] });
        used.add(other);
      }
    }
    
    if (category.children.length > 0) {
      categories.push(category);
    }
  }
  
  // Add remaining phrases as individual categories
  for (const phrase of phrases) {
    if (!used.has(phrase)) {
      categories.push({ title: phrase, children: [] });
    }
  }
  
  return categories.slice(0, 8);
}

// Ensure uploads directory exists
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/", { recursive: true });
}

const upload = multer({ dest: "uploads/" });

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

async function generateAnswer(context, question, history = []) {
  const messages = [
    { role: "system", content: TUTOR_PROMPT },
    { role: "system", content: `CONTEXT:\n${context}` },
    { role: "user", content: `QUESTION: ${question}` }
  ];

  history.forEach(h => {
    messages.push({ role: "user", content: h.question });
    messages.push({ role: "assistant", content: h.answer });
  });

  messages.push({ role: "user", content: question });

  const completion = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages
  });

  return completion.choices[0]?.message?.content || "No response generated.";
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
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});

// Chat endpoint - uses existing vector search from database
app.post("/chat", async (req, res) => {
  try {
    const { question, conversationHistory = [], sessionId, similarityThreshold = 0.05 } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const chunkCount = await getChunkCount();
    if (chunkCount === 0) {
      return res.status(400).json({ error: "Please upload a PDF first" });
    }

    const chatId = sessionId || `chat_${Date.now()}`;

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
    const queryEmbedding = await getEmbedding(question);
    const results = await similaritySearchWithThreshold(queryEmbedding, 3, similarityThreshold);

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

    const answer = await generateAnswer(context, question, conversationHistory);

    const sources = topChunks.map((r) => ({
      text: (r.text || r.chunk_text).substring(0, 200) + "...",
      score: r.score?.toFixed(4) || 0
    }));

    console.log("✅ Answer generated for chat question:", question.substring(0, 30) + "...");

    const responseData = { answer, sessionId: chatId };
    if (INCLUDE_SOURCES) responseData.sources = sources;

    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      response: responseData
    });

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error in chat endpoint:", error.message);
    res.status(500).json({ error: error.message || "Failed to generate answer" });
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
    console.log("✅ Connected to PostgreSQL for vector storage");
    
    clearUploads();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
