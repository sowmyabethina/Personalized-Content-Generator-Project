/**
 * PDF Text Chunker
 * 
 * Splits PDF text into meaningful chunks based on paragraphs and sentences.
 * Preserves heading context and ensures optimal chunk sizes for embedding.
 */

// Heading patterns to detect
const HEADING_PATTERNS = [
  /^UNIT\s+[IVXLC\d]+$/i,           // UNIT I, UNIT 1
  /^CHAPTER\s+\d+/i,                 // CHAPTER 1
  /^SECTION\s+\d+/i,                 // SECTION 1.1
  /^\d+\.\s+[A-Z][^.]{1,50}$/,     // 1. Introduction
  /^\d+\.\d+\s+[A-Z][^.]{1,50}$/,  // 1.1 Background
  /^\d+\.\d+\.\d+\s+[A-Z][^.]{1,50}$/, // 1.1.1 Details
  /^[A-Z][A-Z\s]{4,}$/,             // ALL CAPS HEADINGS
  /^[A-Z][a-zA-Z\s]{10,60}$/,      // Title Case headings
];

/**
 * Check if a line is a heading
 */
function isHeading(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  
  for (const pattern of HEADING_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  
  // Also check for short lines with title case
  const words = trimmed.split(/\s+/);
  if (words.length >= 1 && words.length <= 8) {
    const titleCaseCount = words.filter(w => /^[A-Z][a-z]+$/.test(w)).length;
    if (titleCaseCount >= words.length * 0.7) return true;
  }
  
  return false;
}

/**
 * Get heading level
 */
function getHeadingLevel(line) {
  const trimmed = line.trim();
  
  if (/^UNIT\s+/i.test(trimmed)) return 'unit';
  if (/^CHAPTER/i.test(trimmed)) return 'unit';
  if (/^\d+\.\d+\.\d+\s+/.test(trimmed)) return 'sub-subtopic';
  if (/^\d+\.\d+\s+/.test(trimmed)) return 'subtopic';
  if (/^\d+\.\s+/.test(trimmed)) return 'topic';
  if (/^[A-Z][A-Z\s]{4,}$/.test(trimmed)) return 'topic';
  
  return 'topic';
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Split text into chunks based on paragraphs
 * @param {string} text - Raw PDF text
 * @returns {Array<{id: string, content: string, heading?: string}>}
 */
export function splitIntoChunks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split by double line breaks (paragraphs)
  const paragraphs = text.split(/\n\n+/);
  
  const chunks = [];
  let currentChunk = {
    id: '',
    content: '',
    heading: null,
    wordCount: 0
  };
  
  let chunkId = 1;
  let currentHeading = null;
  
  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;
    
    // Check if this paragraph is a heading
    if (isHeading(trimmedPara)) {
      // Save current chunk if it has content
      if (currentChunk.wordCount >= 40) {
        currentChunk.id = `chunk_${chunkId++}`;
        chunks.push({
          id: currentChunk.id,
          content: currentChunk.content.trim(),
          heading: currentHeading
        });
      }
      
      // Start new chunk with heading
      currentHeading = trimmedPara;
      currentChunk = {
        id: '',
        content: '',
        heading: currentHeading,
        wordCount: 0
      };
      continue;
    }
    
    const paraWords = countWords(trimmedPara);
    
    // If paragraph is too long (>800 words), split by sentences
    if (paraWords > 800) {
      // Save current chunk first
      if (currentChunk.wordCount >= 40) {
        currentChunk.id = `chunk_${chunkId++}`;
        chunks.push({
          id: currentChunk.id,
          content: currentChunk.content.trim(),
          heading: currentHeading
        });
        currentChunk = {
          id: '',
          content: '',
          heading: currentHeading,
          wordCount: 0
        };
      }
      
      // Split by sentence
      const sentences = trimmedPara.split(/(?<=[.?!])\s+/);
      let sentenceChunk = '';
      let sentenceCount = 0;
      
      for (const sentence of sentences) {
        const sentenceWords = countWords(sentence);
        
        if (sentenceCount + sentenceWords > 400) {
          // Save current sentence chunk
          if (countWords(sentenceChunk) >= 40) {
            currentChunk.id = `chunk_${chunkId++}`;
            chunks.push({
              id: currentChunk.id,
              content: sentenceChunk.trim(),
              heading: currentHeading
            });
          }
          sentenceChunk = sentence;
          sentenceCount = 0;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
          sentenceCount += sentenceWords;
        }
      }
      
      // Add remaining sentences
      if (sentenceChunk && countWords(sentenceChunk) >= 40) {
        currentChunk.content += (currentChunk.content ? '\n\n' : '') + sentenceChunk;
        currentChunk.wordCount += countWords(sentenceChunk);
      }
    }
    // If adding this paragraph would exceed 400 words, save current chunk
    else if (currentChunk.wordCount + paraWords > 400) {
      if (currentChunk.wordCount >= 40) {
        currentChunk.id = `chunk_${chunkId++}`;
        chunks.push({
          id: currentChunk.id,
          content: currentChunk.content.trim(),
          heading: currentHeading
        });
      }
      
      // Start new chunk
      currentChunk = {
        id: '',
        content: trimmedPara,
        heading: currentHeading,
        wordCount: paraWords
      };
    }
    // Otherwise, add to current chunk
    else {
      currentChunk.content += (currentChunk.content ? '\n\n' : '') + trimmedPara;
      currentChunk.wordCount += paraWords;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.wordCount >= 40) {
    currentChunk.id = `chunk_${chunkId++}`;
    chunks.push({
      id: currentChunk.id,
      content: currentChunk.content.trim(),
      heading: currentHeading
    });
  }
  
  // Filter out chunks that are too short
  return chunks.filter(chunk => countWords(chunk.content) >= 40);
}

/**
 * Extract headings from chunks for mind map
 */
export function extractHeadings(chunks) {
  const headings = [];
  
  for (const chunk of chunks) {
    if (chunk.heading && !headings.includes(chunk.heading)) {
      headings.push({
        heading: chunk.heading,
        level: getHeadingLevel(chunk.heading)
      });
    }
  }
  
  return headings;
}

/**
 * Get all unique headings from chunks
 */
export function getUniqueHeadings(chunks) {
  const headingMap = new Map();
  
  for (const chunk of chunks) {
    if (chunk.heading && !headingMap.has(chunk.heading)) {
      headingMap.set(chunk.heading, chunk.heading);
    }
  }
  
  return Array.from(headingMap.values());
}
