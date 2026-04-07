/**
 * GitHub Service
 * Extracts user-specific skills from commits (with debug logs)
 */

const axios = require("axios");

// 🔑 GitHub headers (with optional token)
const GITHUB_HEADERS = {
  Accept: "application/vnd.github.v3+json"
};

if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
  GITHUB_HEADERS.Authorization = `token ${process.env.GITHUB_TOKEN.trim()}`;
}

// 🔥 Extension → Skill mapping
const extensionSkillMap = {
  js: "JavaScript",
  jsx: "React",
  ts: "TypeScript",
  tsx: "React",
  py: "Python",
  java: "Java",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  md: "Documentation",
  yml: "DevOps",
  yaml: "DevOps",
  sh: "Shell",
  dockerfile: "Docker"
};

// 🔍 Get skill from filename
function getSkillFromFile(filename) {
  if (!filename) return null;

  const lower = filename.toLowerCase();

  if (lower.includes("dockerfile")) return "Docker";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "DevOps";

  const ext = lower.includes(".") ? lower.split(".").pop() : "";
  return extensionSkillMap[ext] || null;
}

/**
 * Fetch repositories of user
 */
async function fetchUserRepos(username) {
  try {
    console.log("📡 Fetching repositories for:", username);

    const { data } = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: GITHUB_HEADERS,
        params: {
          sort: "updated",
          per_page: 10
        }
      }
    );

    console.log("📦 Total repos fetched:", data.length);
    return data || [];
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data || {};
    const message = data?.message || err.message;

    console.error("❌ Error fetching repos:", data || err.message);

    if (status === 404) {
      const notFoundErr = new Error("GitHub user not found");
      notFoundErr.code = "GITHUB_USER_NOT_FOUND";
      throw notFoundErr;
    }

    if (status === 403 && String(message).toLowerCase().includes("rate limit")) {
      const rateLimitErr = new Error("GitHub API rate limit exceeded");
      rateLimitErr.code = "GITHUB_RATE_LIMIT";
      throw rateLimitErr;
    }

    const fetchErr = new Error("Failed to fetch repositories from GitHub");
    fetchErr.code = "GITHUB_FETCH_FAILED";
    throw fetchErr;
  }
}

/**
 * Extract skills from commits (USER ONLY)
 */
async function extractUserCommitSkills(username) {
  console.log("🚀 Starting GitHub skill extraction for:", username);

  const skillsSet = new Set();

  try {
    const repos = await fetchUserRepos(username);

    if (!repos.length) {
      console.log("⚠️ No repositories found");
      return [];
    }

    // 🔒 Limit repos for performance
    const repoList = repos.slice(0, 5);

    for (const repo of repoList) {
      console.log(`\n📁 Processing repo: ${repo.name}`);

      try {
        // ✅ Get commits ONLY by this user
        const { data: commits } = await axios.get(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`,
          {
            headers: GITHUB_HEADERS,
            params: {
              author: username,
              per_page: 5
            }
          }
        );

        console.log(`🧾 Commits found in ${repo.name}:`, commits.length);

        if (!Array.isArray(commits) || commits.length === 0) continue;

        for (const commit of commits) {
          const sha = commit.sha;
          if (!sha) continue;

          console.log("🔍 Processing commit:", sha);

          try {
            // ✅ Get commit details
            const { data: detail } = await axios.get(
              `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits/${sha}`,
              {
                headers: GITHUB_HEADERS
              }
            );

            const files = detail.files || [];

            console.log(
              "📄 Files in commit:",
              files.map(f => f.filename)
            );

            files.forEach(file => {
              const skill = getSkillFromFile(file.filename);

              if (skill) {
                console.log("✅ Skill detected:", skill);
                skillsSet.add(skill);
              }
            });

          } catch (err) {
            console.error("❌ Commit detail error:", err.response?.data || err.message);
          }
        }

      } catch (err) {
        console.error("❌ Repo commit fetch error:", err.response?.data || err.message);
      }
    }

  } catch (err) {
    console.error("❌ Skill extraction error:", err.message);
    throw err;
  }

  const finalSkills = Array.from(new Set([...skillsSet]));

  console.log("\n🎯 Final extracted skills:", finalSkills);

  return finalSkills;
}

module.exports = {
  extractUserCommitSkills
};
