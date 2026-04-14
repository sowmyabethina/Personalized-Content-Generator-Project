/**
 * Application configuration (non-secret defaults + env overrides).
 * Single place for ports, URLs, and paths used across the server.
 */

const DEFAULT_PORT = 5000;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
const DEFAULT_FRONTEND_FALLBACK_ORIGIN = "http://localhost:3001";
const DEFAULT_RAG_SERVICE_URL = "http://localhost:5001";
const DEFAULT_RPC_SERVICE_URL = "http://localhost:3333";
const DEFAULT_GITHUB_API_BASE_URL = "https://api.github.com";

function trimSlash(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\/+$/, "");
}

export const appConfig = {
  /** HTTP listen port */
  port: Number.parseInt(process.env.PORT, 10) || DEFAULT_PORT,

  /** Directory for uploaded files (relative to process cwd unless absolute) */
  uploadsDir: process.env.UPLOADS_DIR || "./uploads",

  /** Shared timeout configuration */
  timeouts: {
    apiStandard: Number.parseInt(process.env.TIMEOUT_API_STANDARD, 10) || 5000,
    ragOperation: Number.parseInt(process.env.TIMEOUT_RAG_OPERATION, 10) || 90000,
    validation: Number.parseInt(process.env.TIMEOUT_VALIDATION, 10) || 30000,
  },

  /** Shared cache configuration */
  cache: {
    ragResponseTtlMs:
      Number.parseInt(process.env.CACHE_RAG_TTL, 10) || 5 * 60 * 1000,
    ragMaxEntries: Number.parseInt(process.env.CACHE_MAX_SIZE, 10) || 100,
  },
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
  const primary = process.env.CORS_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
  const defaults = [
    primary,
    DEFAULT_FRONTEND_ORIGIN,
    DEFAULT_FRONTEND_FALLBACK_ORIGIN,
  ];
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
  const u = process.env.RAG_SERVICE_URL || DEFAULT_RAG_SERVICE_URL;
  return trimSlash(String(u).trim());
}

/**
 * RPC service URL used for PDF extraction and sidecar operations.
 */
export function getRpcServiceUrl() {
  const u = process.env.RPC_SERVICE_URL || DEFAULT_RPC_SERVICE_URL;
  return trimSlash(String(u).trim());
}

/**
 * GitHub REST API base URL.
 */
export function getGithubApiBaseUrl() {
  const u = process.env.GITHUB_API_BASE_URL || DEFAULT_GITHUB_API_BASE_URL;
  return trimSlash(String(u).trim());
}
