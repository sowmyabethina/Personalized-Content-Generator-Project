import { pipeline } from "@xenova/transformers";

let extractor = null;

export async function getEmbedding(text) {
  if (!extractor) {
    console.log("🔄 Loading embedding model...");
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2" // ✅ SUPPORTED MODEL
    );
    console.log("✅ Embedding model loaded");
  }

  // 🔒 Safety: limit text length
  const safeText = text.slice(0, 2000);

  const output = await extractor(safeText, {
    pooling: "mean",
    normalize: true,
  });

  // 🧠 Handle output safely
  const embedding =
    output.data instanceof Float32Array
      ? Array.from(output.data)
      : Array.from(output.data[0]);

  return embedding;
}
