import { getEmbedding } from "./embeddings.js";
import { similaritySearch, vectors } from "./vectorStore.js";

/**
 * Query the RAG system with a question
 * @param {string} question - The question to ask
 * @param {number} topK - Number of top results to return (default 3)
 * @returns {Promise<string>} - The answer/relevant content from PDFs
 */
export async function queryRag(question, topK = 3) {
  if (!question || typeof question !== "string") {
    throw new Error("Question must be a non-empty string");
  }

  // Check if vector store is empty
  if (vectors.length === 0) {
    throw new Error("No PDFs have been ingested yet. Please upload a PDF first.");
  }

  try {
    // Get embedding for the question
    const queryEmbedding = await getEmbedding(question);

    // Find similar vectors using similarity search
    const results = similaritySearch(queryEmbedding, topK);

    if (results.length === 0) {
      return "No matching content found in the ingested PDFs.";
    }

    // Combine results into a readable answer
    const answer = results
      .map((result, index) => `${index + 1}. ${result.text.substring(0, 500)}...`)
      .join("\n\n");

    return answer;
  } catch (error) {
    console.error("Error querying RAG:", error);
    throw new Error(`Failed to process question: ${error.message}`);
  }
}

