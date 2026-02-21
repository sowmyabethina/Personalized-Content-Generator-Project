/**
 * Embedding Service
 * 
 * Generates embeddings for text chunks using OpenAI's text-embedding-3-small model.
 * Caches embeddings in memory after PDF upload.
 */

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory cache for embeddings (Map<chunkId, embeddingVector>)
const embeddingCache = new Map();

// Store chunk content for retrieval
const chunkContentCache = new Map();

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input for embedding');
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Generate embeddings for all chunks and cache them
 * @param {Array<{id: string, content: string, heading?: string}>} chunks - Array of text chunks
 */
export async function generateEmbeddingsForChunks(chunks) {
  // Clear existing cache
  embeddingCache.clear();
  chunkContentCache.clear();

  console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);

  // Generate embeddings for each chunk
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      
      // Cache the embedding
      embeddingCache.set(chunk.id, embedding);
      
      // Cache the content
      chunkContentCache.set(chunk.id, {
        content: chunk.content,
        heading: chunk.heading
      });
      
      console.log(`✅ Generated embedding for chunk: ${chunk.id}`);
    } catch (error) {
      console.error(`❌ Failed to generate embedding for chunk ${chunk.id}:`, error.message);
    }
  }

  console.log(`✅ Cached ${embeddingCache.size} embeddings`);
}

/**
 * Get embedding for a specific chunk
 * @param {string} chunkId - Chunk ID
 * @returns {number[] | null} - Embedding vector or null if not found
 */
export function getChunkEmbedding(chunkId) {
  return embeddingCache.get(chunkId) || null;
}

/**
 * Get content for a specific chunk
 * @param {string} chunkId - Chunk ID
 * @returns {{content: string, heading?: string} | null}
 */
export function getChunkContent(chunkId) {
  return chunkContentCache.get(chunkId) || null;
}

/**
 * Get all cached chunk IDs
 * @returns {string[]} - Array of chunk IDs
 */
export function getAllChunkIds() {
  return Array.from(embeddingCache.keys());
}

/**
 * Get all chunks with their embeddings
 * @returns {Array<{id: string, content: string, heading?: string, embedding: number[]}>}
 */
export function getAllChunksWithEmbeddings() {
  const result = [];
  
  for (const [id, embedding] of embeddingCache.entries()) {
    const content = chunkContentCache.get(id);
    if (content) {
      result.push({
        id,
        content: content.content,
        heading: content.heading,
        embedding
      });
    }
  }
  
  return result;
}

/**
 * Generate embedding for a question/query
 * @param {string} query - User question
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateQueryEmbedding(query) {
  return generateEmbedding(query);
}

/**
 * Clear all cached embeddings
 */
export function clearEmbeddingCache() {
  embeddingCache.clear();
  chunkContentCache.clear();
  console.log('🗑️ Cleared embedding cache');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    chunkCount: embeddingCache.size,
    cachedChunkIds: Array.from(embeddingCache.keys())
  };
}
