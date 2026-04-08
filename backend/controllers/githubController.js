import { extractUserCommitSkills, processGithubProfile } from "../services/githubService.js";

function extractGithubUsername(profileUrl) {
  if (!profileUrl || typeof profileUrl !== "string") {
    return null;
  }

  const cleanUrl = profileUrl.trim().replace(/\/$/, "");
  const githubProfileRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-_]+$/;

  if (!githubProfileRegex.test(cleanUrl)) {
    return null;
  }

  const username = cleanUrl.split("/").pop();
  return username && /^[a-zA-Z0-9-_]+$/.test(username) ? username : null;
}

async function getGithubSkills(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const skills = await extractUserCommitSkills(username);

    return res.json({
      success: true,
      username,
      skills
    });

  } catch (err) {
    console.error(err);

    if (err.code === "GITHUB_USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "GitHub user not found"
      });
    }

    if (err.code === "GITHUB_RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        error: "GitHub API rate limit exceeded. Add GITHUB_TOKEN in backend/.env and retry."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to extract GitHub skills"
    });
  }
}

async function processGithubProfileRequest(req, res) {
  try {
    const { profileUrl, username: requestedUsername } = req.body;
    const username = requestedUsername || extractGithubUsername(profileUrl);

    if (!profileUrl || !username) {
      return res.status(400).json({
        success: false,
        error: "A valid GitHub profile URL is required"
      });
    }

    const result = await processGithubProfile(profileUrl, username);
    return res.json(result);
  } catch (err) {
    console.error(err);

    if (err.code === "GITHUB_USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "GitHub user not found"
      });
    }

    if (err.code === "GITHUB_RATE_LIMIT") {
      return res.status(429).json({
        success: false,
        error: "GitHub API rate limit exceeded. Add GITHUB_TOKEN in backend/.env and retry."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to process GitHub profile"
    });
  }
}

export { getGithubSkills, processGithubProfileRequest };
export default { getGithubSkills, processGithubProfileRequest };
