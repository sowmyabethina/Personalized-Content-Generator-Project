/**
 * Frontend environment-derived settings (CRA injects REACT_APP_* at build time).
 */

function trimSlash(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\/+$/, "");
}

function buildGithubProfileExample() {
  return process.env.REACT_APP_GITHUB_PROFILE_EXAMPLE || "https://github.com/username";
}

export function getApiBaseUrl() {
  return trimSlash(process.env.REACT_APP_API_URL || "http://localhost:5000");
}

export function getRagServiceBaseUrl() {
  return trimSlash(
    process.env.REACT_APP_RAG_SERVICE_URL || "http://localhost:5001"
  );
}

export function getClerkPublishableKey() {
  return process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "";
}

export function getClerkJsUrl() {
  return (
    process.env.REACT_APP_CLERK_JS_URL ||
    "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
  );
}

export function getGithubProfileExample() {
  return buildGithubProfileExample();
}

export function getYoutubeSearchBaseUrl() {
  return trimSlash(
    process.env.REACT_APP_YOUTUBE_SEARCH_BASE_URL ||
      "https://www.youtube.com/results"
  );
}
