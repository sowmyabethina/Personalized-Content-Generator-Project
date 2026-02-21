/**
 * Vector Search Service
 * 
 * Performs semantic search using cosine similarity between
 * question embedding and chunk embeddings.
 */

import { 
  getAllChunksWithEmbeddings, 
  generateQueryEmbedding 
} from './embeddingService.js';

// Similarity threshold
const SIMILARITY_THRESHOLD = 0.35;
const DEFAULT_TOP_K = 5;

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Search for relevant chunks based on question
 * @param {string} question - User question
 * @param {number} topK - Number of results to return
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Array<{id: string, content: string, heading?: string, score: number}>>}
 */
export async function semanticSearch(question, topK = DEFAULT_TOP_K, threshold = SIMILARITY_THRESHOLD) {
  if (!question || typeof question !== 'string') {
    throw new Error('Invalid question input');
  }

  console.log(`🔍 Performing semantic search for: "${question.substring(0, 50)}..."`);

  // Generate embedding for the question
  const questionEmbedding = await generateQueryEmbedding(question);

  // Get all chunks with their embeddings
  const chunks = getAllChunksWithEmbeddings();

  if (chunks.length === 0) {
    console.warn('⚠️ No chunks available for search');
    return [];
  }

  // Calculate similarity scores
  const scoredChunks = [];

  console.log(`🔍 Comparing against ${chunks.length} cached chunks`);

  for (const chunk of chunks) {
    const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
    
    console.log(`   Chunk ${chunk.id}: similarity = ${similarity.toFixed(4)}`);
    
    if (similarity >= threshold) {
      scoredChunks.push({
        id: chunk.id,
        content: chunk.content,
        heading: chunk.heading,
        score: similarity
      });
    }
  }

  // Sort by similarity score (descending)
  scoredChunks.sort((a, b) => b.score - a.score);

  // Return top K results
  const results = scoredChunks.slice(0, topK);

  console.log(`✅ Found ${results.length} relevant chunks (threshold: ${threshold})`);
  
  // Log top results
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] Score: ${r.score.toFixed(4)} - ${r.heading || 'No heading'}`);
  });

  return results;
}

/**
 * Search with custom threshold
 * @param {string} question - User question
 * @param {number} topK - Number of results
 * @returns {Promise<Array<{id: string, content: string, heading?: string, score: number}>>}
 */
export async function searchWithThreshold(question, topK = DEFAULT_TOP_K) {
  return semanticSearch(question, topK, SIMILARITY_THRESHOLD);
}

/**
 * Get chunks by heading (for mind map organization)
 * @param {Array<{id: string, content: string, heading?: string, score: number}>} chunks - Chunks to group
 * @returns {Object} - Chunks grouped by heading
 */
export function groupByHeading(chunks) {
  const grouped = {};

  for (const chunk of chunks) {
    const heading = chunk.heading || 'Uncategorized';
    
    if (!grouped[heading]) {
      grouped[heading] = [];
    }
    
    grouped[heading].push(chunk);
  }

  return grouped;
}
