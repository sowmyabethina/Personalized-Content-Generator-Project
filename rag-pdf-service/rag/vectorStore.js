// Simple FAISS-style in-memory vector store

export const vectors = [];
let dimension = null;

export function addVector(embedding, text) {
  if (!dimension) {
    dimension = embedding.length;
    console.log("✅ Vector dimension set:", dimension);
  }

  if (!embedding || !text) {
    console.warn("⚠️ Attempted to add invalid vector or text");
    return;
  }

  if (embedding.length !== dimension) {
    console.warn("⚠️ Embedding dimension mismatch");
    return;
  }

  vectors.push({ embedding, text });
}

export function similaritySearch(queryEmbedding, topK = 3) {
  if (!vectors.length) {
    console.warn("⚠️ similaritySearch called but no vectors stored");
    return [];
  }

  if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
    console.warn("⚠️ Invalid query embedding");
    return [];
  }

  try {
    return vectors
      .map(v => ({
        text: v.text,
        score: cosineSimilarity(queryEmbedding, v.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error("❌ similaritySearch error:", error.message);
    return [];
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  
  if (denominator === 0) {
    return 0;
  }

  return dot / denominator;
}