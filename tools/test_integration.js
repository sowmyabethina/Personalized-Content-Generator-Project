import fetch from "node-fetch";

async function testPdfGeneration() {
  const githubUrl = "https://github.com/sowmyabethina/mcp/blob/main/sample.pdf";

  console.log("🔄 Testing: Extract PDF + Generate Questions...\n");

  try {
    const res = await fetch("http://localhost:5000/generate-from-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_url: githubUrl })
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ SUCCESS!");
      console.log("📄 Response:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("❌ ERROR:", data);
    }
  } catch (err) {
    console.error("❌ Connection Error:", err.message);
    console.log("Make sure:");
    console.log("  - PDF microservice is running on port 3333");
    console.log("  - Backend is running on port 5000");
  }
}

testPdfGeneration();
