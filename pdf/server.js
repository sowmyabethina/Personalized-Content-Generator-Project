import { createServer } from "http";
import fetch from "node-fetch";
import { createRequire } from "module";
import "dotenv/config";
import { generateQuestions } from "./questionGenerator.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // ✅ works ONLY with v1.1.1

function githubToRaw(url) {
  if (url.includes("raw.githubusercontent.com")) return url;

  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repo, branch, path] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(path)}`;
}

async function fetchPDF(githubUrl) {
  const rawUrl = githubToRaw(githubUrl);
  console.log("Fetching PDF:", rawUrl);

  const res = await fetch(rawUrl);
  if (!res.ok) throw new Error("Failed to fetch PDF");

  const buffer = Buffer.from(await res.arrayBuffer());

  // ✅ REAL PDF check (not headers)
  if (!buffer.slice(0, 4).toString().includes("%PDF")) {
    throw new Error("Not a valid PDF file");
  }

  return buffer;
}

const server = createServer(async (req, res) => {
  let body = "";
  req.on("data", c => body += c);
  req.on("end", async () => {
    try {
      const request = JSON.parse(body);

      if (request.method === "tools/call") {
        const { name, arguments: args } = request.params;

        // ==================== Extract PDF only ====================
        if (name === "read_github_pdf") {
          const buffer = await fetchPDF(args.github_url);
          const data = await pdfParse(buffer); // ✅ WORKS

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              text: data.text.substring(0, 3000)
            }
          }));
          return;
        }

        // ==================== Extract PDF + Generate Questions ====================
        if (name === "read_github_pdf_and_generate_questions") {
          const buffer = await fetchPDF(args.github_url);
          const data = await pdfParse(buffer);
          const text = data.text;

          const questions = await generateQuestions(text);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: { questions }
          }));
          return;
        }
      }

      throw new Error("Unknown MCP method");
    } catch (err) {
      console.error("❌ SERVER ERROR:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: err.message }
      }));
    }
  });
});

server.listen(3333, () =>
  console.log("✅ MCP GitHub PDF server running on port 3333")
);