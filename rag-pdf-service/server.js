import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { ingestPdf } from "./rag/ingestPdf.js";
import { queryRag } from "./rag/queryRag.js";

const app = express();
app.use(cors()); // Enable CORS for frontend on port 3000
app.use(express.json());

// Ensure uploads directory exists
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/");
}

const upload = multer({ dest: "uploads/" });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    await ingestPdf(req.file.path);
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    res.json({ message: "PDF processed & stored in vector DB" });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    const answer = await queryRag(question);
    res.json({ answer });
  } catch (error) {
    console.error("Error answering question:", error);
    res.status(500).json({ error: error.message || "Failed to answer question" });
  }
});

app.listen(5001, () => {
  console.log("🚀 RAG Server running on port 5001");
});
