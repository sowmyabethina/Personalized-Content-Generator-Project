const { extractUserCommitSkills } = require("../services/githubService");

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

module.exports = {
  getGithubSkills
};
