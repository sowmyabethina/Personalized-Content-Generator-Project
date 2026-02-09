import { pipeline } from "@xenova/transformers";

let extractor = null;

export async function getEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot get embedding for empty text");
  }

  try {
    if (!extractor) {
      console.log("🔄 Loading embedding model...");
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("✅ Embedding model loaded");
    }
  } catch (modelError) {
    console.error("❌ Failed to load embedding model:", modelError.message);
    throw new Error("Embedding model failed to load. Check internet connection and try again.");
  }

  const safeText = text.slice(0, 2000);

  try {
    const output = await extractor(safeText, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  } catch (embedError) {
    console.error("❌ Embedding generation failed:", embedError.message);
    throw embedError;
  }
}
