import ENDPOINTS from "../../config/api";
import { requestJson } from "../api/http";

export const extractGithubUsername = (url) => {
  if (!url || typeof url !== "string") return null;

  const cleanUrl = url.trim().replace(/\/$/, "");
  const githubProfileRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-_]+$/;

  if (!githubProfileRegex.test(cleanUrl)) {
    return null;
  }

  const username = cleanUrl.split("/").pop();
  return username && /^[a-zA-Z0-9-_]+$/.test(username) ? username : null;
};

const buildGithubSkillsContent = (username, skills, repos) =>
  `GitHub Profile: ${username}\n\nSkills: ${skills.join(", ")}\n\nRepositories:\n${repos
    .slice(0, 10)
    .map((repo) => `- ${repo.name}: ${repo.language || "Unknown"} - ${repo.description || "No description"}`)
    .join("\n")}`;

export const processProfile = async (profileUrl) => {
  const username = extractGithubUsername(profileUrl);

  if (!username) {
    throw new Error("Please enter a valid GitHub profile URL (e.g., https://github.com/username)");
  }

  const payload = await requestJson(
    ENDPOINTS.GITHUB.PROCESS,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrl, username }),
    },
    "Failed to process GitHub profile."
  );

  const repos = Array.isArray(payload?.repos) ? payload.repos : [];
  const skills = Array.isArray(payload?.skills) ? payload.skills : [];

  if (skills.length === 0 && repos.length === 0) {
    throw new Error("Unable to fetch GitHub data");
  }

  return {
    username,
    repos,
    skills,
    content: payload?.content || buildGithubSkillsContent(username, skills, repos),
  };
};

const githubService = {
  extractGithubUsername,
  processProfile,
};

export default githubService;
