import fs from "fs";
import { getEmbedding } from "./embeddings.js";
import { addVectorsBatch, clearVectorStore, generatePdfId } from "./vectorStore.js";

// Text splitter for semantic paragraphs (not fixed characters)
function splitText(text, maxChunkSize = 800, minChunkSize = 100) {
  if (!text || typeof text !== "string") return [];
  
  // Split by double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  
  if (paragraphs.length === 0) {
    // Fallback to fixed-size chunks if no paragraphs found
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = start + maxChunkSize;
      chunks.push(text.slice(start, end));
      start = end - 100; // 100 char overlap
    }
    return chunks;
  }
  
  const chunks = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    // If paragraph is huge, split it further
    if (paragraph.length > maxChunkSize * 1.5) {
      // Add current chunk if it exists
      if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      
      // Split large paragraph by sentences or fixed size
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length < maxChunkSize) {
          currentChunk += (currentChunk ? " " : "") + sentence;
        } else {
          if (currentChunk.length >= minChunkSize) {
            chunks.push(currentChunk);
          }
          currentChunk = sentence;
        }
      }
    } else {
      // Check if adding this paragraph would exceed max size
      if (currentChunk.length + paragraph.length < maxChunkSize) {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      } else {
        // Current chunk is big enough, push it
        if (currentChunk.length >= minChunkSize) {
          chunks.push(currentChunk);
        }
        currentChunk = paragraph;
      }
    }
  }
  
  // Don't forget last chunk
  if (currentChunk.length >= minChunkSize) {
    chunks.push(currentChunk);
  }
  
  console.log(`📌 Split text into ${chunks.length} semantic chunks`);
  return chunks;
}

// Detect if text is in multi-column layout based on vertical positions
function detectColumnLayout(textItems) {
  if (textItems.length < 10) return false;
  
  // Get all Y positions
  const yPositions = textItems.map(item => item.transform && item.transform[5] || 0);
  
  // Sort and find clusters of Y positions
  const sortedY = [...new Set(yPositions)].sort((a, b) => b - a);
  
  // If we have many distinct Y positions close together, likely multi-column
  if (sortedY.length < 10) return false;
  
  // Check for clustering - multi-column PDFs have repeated Y values
  const yGroups = {};
  yPositions.forEach(y => {
    const group = Math.round(y / 20) * 20; // Group by 20-unit intervals
    yGroups[group] = (yGroups[group] || 0) + 1;
  });
  
  const groups = Object.values(yGroups);
  const maxGroup = Math.max(...groups);
  const avgGroup = groups.reduce((a, b) => a + b, 0) / groups.length;
  
  // If one group dominates, likely single column
  // If multiple groups have similar counts, likely multi-column
  return maxGroup < groups.length * 1.5;
}

// Merge text items preserving reading order and handling multi-column layouts
function mergeTextItems(textItems) {
  if (!textItems || textItems.length === 0) return "";
  
  // Sort by page first, then by Y position (top to bottom), then by X position (left to right)
  const sortedItems = [...textItems].sort((a, b) => {
    const pageDiff = (a.page || 1) - (b.page || 1);
    if (pageDiff !== 0) return pageDiff;
    
    const yA = a.transform?.[5] || 0;
    const yB = b.transform?.[5] || 0;
    
    // For same Y (same line), sort by X
    if (Math.abs(yA - yB) < 10) {
      const xA = a.transform?.[4] || 0;
      const xB = b.transform?.[4] || 0;
      return xA - xB;
    }
    
    // Top to bottom (higher Y = higher on page in PDF coordinates)
    return yB - yA;
  });
  
  // Merge items into paragraphs
  const paragraphs = [];
  let currentParagraph = "";
  let lastY = null;
  let lastX = null;
  
  for (const item of sortedItems) {
    const text = item.str?.trim();
    if (!text) continue;
    
    const y = item.transform?.[5] || 0;
    const x = item.transform?.[4] || 0;
    
    // Check if this is a new paragraph (significant Y gap)
    if (lastY !== null && Math.abs(y - lastY) > 30) {
      if (currentParagraph.length > 20) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = text;
    } else if (currentParagraph.length > 0) {
      // Check if this is continuation (same line or nearby)
      const sameLine = lastY !== null && Math.abs(y - lastY) < 10;
      const isContinuation = lastX !== null && x > lastX;
      
      if (sameLine && isContinuation) {
        currentParagraph += " " + text;
      } else if (!sameLine) {
        // New line in same paragraph
        currentParagraph += " " + text;
      } else {
        currentParagraph += text;
      }
    } else {
      currentParagraph = text;
    }
    
    lastY = y;
    lastX = x;
  }
  
  // Don't forget last paragraph
  if (currentParagraph.length > 20) {
    paragraphs.push(currentParagraph.trim());
  }
  
  return paragraphs.join("\n\n");
}

// Clean and repair broken sentences
function cleanExtractedText(text) {
  if (!text) return "";
  
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, " ");
  
  // Fix broken sentences at line breaks
  cleaned = cleaned.replace(/([a-z])\n([A-Z])/g, "$1 $2");
  cleaned = cleaned.replace(/([.,;:])\n/g, "$1 ");
  
  // Remove isolated single characters that might be OCR artifacts
  cleaned = cleaned.replace(/\b[a-z]\s{2,}/g, (match) => match.charAt(0));
  
  // Remove page numbers and footers
  cleaned = cleaned.replace(/\b\d+\s*$/gm, "");
  cleaned = cleaned.replace(/^\s*\d+\s*/gm, "");
  
  // Fix common column-merge issues
  // Remove hyphenation at end of lines
  cleaned = cleaned.replace(/-\s*$/gm, "");
  
  // Ensure sentences have proper spacing
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");
  
  return cleaned.trim();
}

// Extract text from PDF using pdfjs-dist with layout-aware processing
async function extractTextFromPDF(filePath) {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    
    const data = fs.readFileSync(filePath);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log(`📄 Processing ${pdf.numPages} pages...`);
    
    let allTextItems = [];
    
    // Extract text items with position information
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Add page number to items for sorting
      textContent.items.forEach(item => {
        item.page = i;
      });
      
      allTextItems = allTextItems.concat(textContent.items);
      
      if (i % 5 === 0) {
        console.log(`📄 Extracted text from page ${i}/${pdf.numPages}`);
      }
    }
    
    if (allTextItems.length < 10) {
      throw new Error("Not enough text content extracted");
    }
    
    // Merge text items preserving reading order
    console.log("🔧 Merging text items with layout awareness...");
    const mergedText = mergeTextItems(allTextItems);
    
    // Clean the extracted text
    console.log("🧹 Cleaning extracted text...");
    const cleanedText = cleanExtractedText(mergedText);
    
    if (cleanedText.length < 50) {
      throw new Error("Cleaned text too short");
    }
    
    console.log(`✅ Successfully extracted ${cleanedText.length} characters from PDF`);
    return cleanedText;
    
  } catch (pdfError) {
    console.warn("⚠️ pdfjs-dist extraction failed:", pdfError.message);
    
    // Fallback to pdf-parse
    try {
      const pdf = await import("pdf-parse");
      const buffer = fs.readFileSync(filePath);
      const data = await pdf.default(buffer);
      
      if (data.text && data.text.trim().length > 50) {
        console.log("✅ Fallback to pdf-parse successful");
        return cleanExtractedText(data.text);
      }
    } catch (fallbackError) {
      console.warn("⚠️ pdf-parse also failed");
    }
    
    throw new Error("Could not extract text from PDF - file may be scanned image or encrypted");
  }
}

export async function ingestPdf(filePath, pdfId = null) {
  console.log("📄 Starting PDF ingestion:", filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file not found");
  }

  const stats = fs.statSync(filePath);
  if (stats.size < 100) {
    throw new Error("PDF file is too small");
  }

  // Generate PDF ID if not provided
  const fileName = filePath.split("/").pop().split("\\").pop();
  const currentPdfId = pdfId || generatePdfId(fileName);

  try {
    // Extract text using layout-aware processing
    const text = await extractTextFromPDF(filePath);
    
    if (!text || !text.trim()) {
      throw new Error("PDF has no readable text");
    }

    console.log(`📝 Total extracted: ${text.length} characters`);

    // Split text into chunks
    const chunks = splitText(text);
    console.log(`📌 Split into ${chunks.length} chunks`);

    // Clear old vectors for this PDF before re-indexing
    console.log("🗑️ Clearing old vector store...");
    await clearVectorStore();

    let count = 0;
    const chunksWithEmbeddings = [];

    // Generate embeddings for all chunks
    for (const chunk of chunks) {
      if (chunk.trim().length < 10) continue;
      
      try {
        const embedding = await getEmbedding(chunk);
        chunksWithEmbeddings.push({
          text: chunk,
          embedding: embedding,
          pageNumber: null
        });
        count++;
        
        if (count % 5 === 0) {
          console.log(`📌 Generated embeddings for ${count}/${chunks.length} chunks`);
        }
      } catch (embError) {
        console.warn("⚠️ Failed to embed chunk:", embError.message);
      }
    }

    // Batch insert all chunks with embeddings to database
    if (chunksWithEmbeddings.length > 0) {
      console.log("💾 Saving chunks to PostgreSQL database...");
      const pdfId = generatePdfId(fileName);
      await addVectorsBatch(chunksWithEmbeddings, pdfId);
    }

    console.log(`✅ PDF successfully ingested: ${count} chunks stored in database`);
    return { chunkCount: count };

  } catch (error) {
    console.error("❌ Error processing PDF:", error.message);
    throw error;
  }
}
