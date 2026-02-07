import fs from "fs";
import pdf from "pdf-parse";
import { addVector } from "./vectorStore.js";
import { getEmbedding } from "./embeddings.js";

/**
 * Split text into chunks with overlap
 * @param {string} text
 * @param {number} chunkSize
 * @param {number} overlap
 */
function splitText(text, chunkSize = 800, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end);
    chunks.push(chunk);

    // Move start forward but keep overlap
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Ingest PDF: read file, clean text, split, embed, and store
 * @param {string} filePath
 */
export async function ingestPdf(filePath) {
  console.log("📄 Reading PDF:", filePath);

  // Read the PDF file
  const buffer = fs.readFileSync(filePath);
  const pdfData = await pdf(buffer);

  if (!pdfData.text || pdfData.text.trim().length === 0) {
    throw new Error("❌ PDF has no extractable text");
  }

  // Clean the text for better formatting
  let text = pdfData.text;
  text = text.replace(/\n+/g, " "); // remove line breaks
  text = text.replace(/\s+/g, " ").trim(); // remove extra spaces

  // Split text into chunks with overlap
  const chunks = splitText(text, 800, 200);
  console.log(`✂️ Total chunks created: ${chunks.length}`);

  // Embed and store each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk);
    addVector(embedding, chunk);

    console.log(`📌 Stored chunk ${i + 1}/${chunks.length}`);
  }

  console.log("✅ PDF successfully ingested using LOCAL embeddings with overlap");
}
