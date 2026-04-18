/**
 * PDF Service
 * Handles PDF processing operations
 */

import fs from "fs";
import axios from "axios";
import pdf from "pdf-parse";
import { getRpcServiceUrl } from "../config/index.js";
import { logError, logSuccess, log } from "../utils/logger.js";

const RPC_SERVICE_URL = getRpcServiceUrl();

/**
 * Process a resume PDF
 * @param {string} filePath - Path to PDF file
 * @returns {Object} - Processed result
 */
async function processResumePdf(filePath) {
  const stats = fs.statSync(filePath);
  
  if (stats.size < 100) {
    fs.unlinkSync(filePath);
    throw new Error('PDF file is too small or empty');
  }

  // Extract text from PDF
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  if (!data.text || data.text.trim().length < 50) {
    fs.unlinkSync(filePath);
    throw new Error('Could not extract text from PDF');
  }

  // Clean up uploaded file
  fs.unlinkSync(filePath);

  // Filter technical content from resume
  const technicalText = filterTechnicalContent(data.text);

  if (technicalText.length < 100) {
    throw new Error('Not enough technical content to generate questions. Resume appears to lack technical skills, experience, or projects.');
  }

  return {
    text: technicalText,
    fullText: data.text,
    pageCount: data.numpages
  };
}

/**
 * Filter technical content from resume text
 * @param {string} text - Raw text
 * @returns {string} - Filtered technical content
 */
function filterTechnicalContent(text) {
  const lines = text.split('\n');
  const technicalLines = [];
  
  // Categories to keep (technical content)
  const technicalKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'scala', 'r',
    // Web technologies
    'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'jquery', 'ajax',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'firebase',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'terraform',
    // Data Science & ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit', 'nlp', 'computer vision',
    // Frameworks & Libraries
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum', 'tdd', 'testing',
    // Other technical terms
    'algorithm', 'data structure', 'api', 'backend', 'frontend', 'fullstack', 'debugging', 'optimization'
  ];
  
  // Personal info to remove
  const personalInfoPatterns = [
    /^email:\s*/i,
    /^phone:\s*/i,
    /^address:\s*/i,
    /^linkedin:\s*/i,
    /^github:\s*/i,
    /^portfolio:\s*/i,
    /^website:\s*/i,
    /^dob:\s*/i,
    /^date of birth/i,
    /^gender:\s*/i,
    /^marital status/i,
    /^nationality/i,
    /^visa status/i
  ];
  
  // Section headers to keep
  const sectionHeaders = [
    /experience/i,
    /education/i,
    /skills/i,
    /projects/i,
    /certifications/i,
    /publications/i,
    /awards/i,
    /technical/i
  ];
  
  let inTechnicalSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Skip personal information
    let skipLine = false;
    for (const pattern of personalInfoPatterns) {
      if (pattern.test(trimmed)) {
        skipLine = true;
        break;
      }
    }
    if (skipLine) continue;
    
    // Check if this is a section header
    if (sectionHeaders.some(h => h.test(trimmed))) {
      inTechnicalSection = /experience|education|skills|projects|certifications|technical/i.test(trimmed);
      technicalLines.push(trimmed);
      continue;
    }
    
    // Check if line contains technical content
    const lowerLine = trimmed.toLowerCase();
    const hasTechnical = technicalKeywords.some(kw => lowerLine.includes(kw));
    
    // Keep lines in technical sections or with technical keywords
    if (inTechnicalSection || hasTechnical || trimmed.length > 50) {
      technicalLines.push(trimmed);
    }
  }
  
  return technicalLines.join('\n\n');
}

/**
 * Extract GitHub repository URLs from text
 * @param {string} text - Text to search
 * @returns {Array<string>} - Array of GitHub URLs
 */
function extractGitHubUrls(text) {
  if (!text) return [];
  
  // Regex patterns for GitHub URLs
  const githubPatterns = [
    // Match github.com/username/repo (with or without https)
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi,
    // Match raw.githubusercontent.com URLs
    /(?:https?:\/\/)?raw\.githubusercontent\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi,
    // Match gist.github.com URLs
    /(?:https?:\/\/)?gist\.github\.com\/[a-zA-Z0-9_-]+/gi
  ];
  
  const urls = new Set();
  
  for (const pattern of githubPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        let cleanUrl = match;
        
        // Remove tree/branch references
        cleanUrl = cleanUrl.replace(/\/tree\/[a-zA-Z0-9_-]+/gi, '');
        cleanUrl = cleanUrl.replace(/\/blob\/[a-zA-Z0-9_-]+/gi, '');
        cleanUrl = cleanUrl.replace(/\/raw\/[a-zA-Z0-9_-]+/gi, '');
        
        // Ensure it starts with https
        if (!cleanUrl.startsWith('http')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        
        // Remove trailing slashes and fragments
        cleanUrl = cleanUrl.split('/').filter((part, i, arr) => {
          return !(i === arr.length - 1 && (part === '' || part.startsWith('#')));
        }).join('/');
        
        // Only add if it looks like a valid repo URL
        if (cleanUrl.includes('github.com/') && !cleanUrl.includes('/issues') && !cleanUrl.includes('/pull') && !cleanUrl.includes('/actions')) {
          urls.add(cleanUrl);
        }
      });
    }
  }
  
  return Array.from(urls);
}

/**
 * Read PDF from GitHub URL via external service
 * @param {string} githubUrl - GitHub URL
 * @returns {Object} - Extracted text result
 */
async function readPdfFromGithub(githubUrl) {
  log(`Reading PDF from URL: ${githubUrl}`);
  
  const rpcBody = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: 'read_github_pdf', arguments: { github_url: githubUrl } }
  };

  const response = await axios.post(RPC_SERVICE_URL, rpcBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  const data = response.data;
  
  if (!data?.result?.text) {
    throw new Error('No text extracted from PDF');
  }

  return {
    text: data.result.text,
    characterCount: data.result.text.length
  };
}

export { processResumePdf, filterTechnicalContent, extractGitHubUrls, readPdfFromGithub };
export default { processResumePdf, filterTechnicalContent, extractGitHubUrls, readPdfFromGithub };
