/**
 * Frontend environment-derived settings (CRA injects REACT_APP_* at build time).
 */

function trimSlash(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  return trimSlash(process.env.REACT_APP_API_URL || "http://localhost:5000");
}

export function getRagServiceBaseUrl() {
  return trimSlash(
    process.env.REACT_APP_RAG_SERVICE_URL || "http://localhost:5001"
  );
}
