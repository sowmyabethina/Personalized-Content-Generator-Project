// greptile review trigger
import express from "express";
import { getGithubSkills, processGithubProfileRequest } from "../controllers/githubController.js";

const router = express.Router();

router.post("/extract-skills", getGithubSkills);
router.post("/process", processGithubProfileRequest);

export default router;
