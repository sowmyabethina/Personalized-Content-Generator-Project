// Simple FAISS-style in-memory vector store

export const vectors = [];
let dimension = null;

export function addVector(embedding, text) {
  if (!dimension) {
    dimension = embedding.length;
    console.log("✅ Vector dimension set:", dimension);
  }

  vectors.push({ embedding, text });
}

export function similaritySearch(queryEmbedding, topK = 3) {
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