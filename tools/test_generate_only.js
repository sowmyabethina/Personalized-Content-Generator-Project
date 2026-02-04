import fetch from "node-fetch";

async function testGenerate() {
  console.log("Testing /generate-from-pdf endpoint...\n");

  try {
    const res = await fetch("http://localhost:5000/generate-from-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_url: "https://github.com/sowmyabethina/mcp/blob/main/sample.pdf" })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Full Response:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testGenerate();
