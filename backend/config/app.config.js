/**
 * Application configuration (non-secret defaults + env overrides).
 * Single place for ports, URLs, and paths used across the server.
 */

const DEFAULT_PORT = 5000;

function trimSlash(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\/+$/, "");
}

export const appConfig = {
  /** HTTP listen port */
  port: Number.parseInt(process.env.PORT, 10) || DEFAULT_PORT,

  /** Directory for uploaded files (relative to process cwd unless absolute) */
  uploadsDir: process.env.UPLOADS_DIR || "./uploads",
};

/**
 * Origins allowed for CORS. Set CORS_ALLOWED_ORIGINS=comma,separated,list
 * or rely on CORS_ORIGIN + dev defaults.
 */
export function getCorsAllowedOrigins() {
  const list = process.env.CORS_ALLOWED_ORIGINS;
  if (list && String(list).trim()) {
    return String(list)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const primary = process.env.CORS_ORIGIN || "http://localhost:3000";
  const defaults = [primary, "http://localhost:3000", "http://localhost:3001"];
  return [...new Set(defaults)];
}

/**
 * Public base URL of this API (used by agent tools calling back into the same server).
 */
export function getBackendPublicUrl() {
  const fromEnv = process.env.BACKEND_URL || process.env.PUBLIC_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return trimSlash(String(fromEnv).trim());
  }
  return `http://localhost:${appConfig.port}`;
}

/**
 * RAG / PDF sidecar service (separate process).
 */
export function getRagServiceUrl() {
  const u = process.env.RAG_SERVICE_URL || "http://localhost:5001";
  return trimSlash(String(u).trim());
}
