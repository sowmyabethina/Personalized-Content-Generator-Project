import { pipeline } from "@xenova/transformers";

let extractor = null;

export async function getEmbedding(text) {
  if (!extractor) {
    console.log("🔄 Loading embedding model...");
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model loaded");
  }

  const safeText = text.slice(0, 2000);

  const output = await extractor(safeText, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}