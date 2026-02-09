import fs from "fs";
import { getEmbedding } from "./embeddings.js";
import { addVector } from "./vectorStore.js";

function splitText(text, chunkSize = 500, overlap = 50) {
  if (!text || typeof text !== "string") return [];
  
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

async function extractTextFromPDF(filePath) {
  // Use pdfjs-dist for better PDF parsing
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    // Set worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    
    const data = fs.readFileSync(filePath);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
      
      if (i % 5 === 0) {
        console.log(`📄 Extracted page ${i}/${pdf.numPages}`);
      }
    }
    
    if (fullText.length < 50) {
      throw new Error("Extracted text too short");
    }
    
    console.log(`✅ Successfully extracted ${fullText.length} characters using pdfjs-dist`);
    return fullText;
    
  } catch (pdfError) {
    console.warn("⚠️ pdfjs-dist failed:", pdfError.message);
    
    // Fallback to pdf-parse
    try {
      const pdf = await import("pdf-parse");
      const buffer = fs.readFileSync(filePath);
      const data = await pdf.default(buffer);
      
      if (data.text && data.text.trim().length > 50) {
        console.log("✅ Fallback to pdf-parse successful");
        return data.text;
      }
    } catch (fallbackError) {
      console.warn("⚠️ pdf-parse also failed");
    }
    
    throw new Error("Could not extract text from PDF - file may be scanned image or encrypted");
  }
}

export async function ingestPdf(filePath) {
  console.log("📄 Reading PDF:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file not found");
  }

  const stats = fs.statSync(filePath);
  if (stats.size < 100) {
    throw new Error("PDF file is too small");
  }

  try {
    const text = await extractTextFromPDF(filePath);
    
    if (!text || !text.trim()) {
      throw new Error("PDF has no readable text");
    }

    console.log(`📝 Total extracted: ${text.length} characters`);

    const chunks = splitText(text);
    console.log(`📌 Split into ${chunks.length} chunks`);

    let count = 0;

    for (const chunk of chunks) {
      if (chunk.trim().length < 10) continue;
      
      try {
        const embedding = await getEmbedding(chunk);
        addVector(embedding, chunk);
        count++;
        
        if (count % 5 === 0) {
          console.log(`📌 Processed ${count}/${chunks.length} chunks`);
        }
      } catch (embError) {
        console.warn("⚠️ Failed to embed chunk:", embError.message);
      }
    }

    console.log(`✅ PDF successfully ingested: ${count} chunks stored`);

  } catch (error) {
    console.error("❌ Error processing PDF:", error.message);
    throw error;
  }
}

// Vector storage - in-memory
const vectors = [];
let dimension = null;

export function addVector(embedding, text) {
  if (!dimension) {
    dimension = embedding.length;
    console.log("✅ Vector dimension set:", dimension);
  }
  vectors.push({ embedding, text });
}

export function similaritySearch(queryEmbedding, topK = 5) {
  return vectors
    .map(v => ({
      text: v.text,
      score: cosineSimilarity(queryEmbedding, v.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
