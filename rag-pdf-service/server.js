import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { ingestPdf } from "./rag/ingestPdf.js";
import { getEmbedding } from "./rag/embeddings.js";
import { similaritySearch } from "./rag/vectorStore.js";

const app = express();
const PORT = 5001;

// Global error handlers to prevent crashes
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
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

// Reset endpoint
app.post("/reset", (req, res) => {
  currentPdfInfo = {
    fileName: null,
    ingested: false
  };
  clearUploads();
  res.json({ message: "Vector store reset" });
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
  console.log(`🚀 RAG PDF Service running on port ${PORT}`);
  console.log(`   - POST /upload-pdf - Upload a PDF`);
  console.log(`   - POST /ask - Ask questions about uploaded PDF`);
  console.log(`   - GET /health - Check service status`);
  console.log(`   - POST /reset - Reset vector store`);
});
