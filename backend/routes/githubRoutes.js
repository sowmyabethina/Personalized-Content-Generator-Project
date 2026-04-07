const express = require("express");
const router = express.Router();
const { getGithubSkills } = require("../controllers/githubController");

router.post("/extract-skills", getGithubSkills);

module.exports = router;