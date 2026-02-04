import fetch from "node-fetch";

async function testServices() {
  console.log("🧪 Testing All Services...\n");

  // Test 1: PDF Microservice
  console.log("1️⃣ Testing PDF Microservice (port 3333)...");
  try {
    const pdfRes = await fetch("http://localhost:3333", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "read_github_pdf",
          arguments: { github_url: "https://github.com/sowmyabethina/mcp/blob/main/sample.pdf" }
        }
      })
    });
    const data = await pdfRes.json();
    if (pdfRes.ok && data.result) {
      console.log("✅ PDF Microservice: OK");
      console.log(`   Extracted text length: ${data.result.text.length} chars\n`);
    } else {
      console.log("❌ PDF Microservice: Error -", data.error?.message, "\n");
    }
  } catch (err) {
    console.log("❌ PDF Microservice: Connection failed -", err.message, "\n");
  }

  // Test 2: Backend /read-pdf endpoint
  console.log("2️⃣ Testing Backend /read-pdf (port 5000)...");
  try {
    const backRes = await fetch("http://localhost:5000/read-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_url: "https://github.com/sowmyabethina/mcp/blob/main/sample.pdf" })
    });
    const data = await backRes.json();
    if (backRes.ok && data.text) {
      console.log("✅ Backend /read-pdf: OK");
      console.log(`   Extracted text length: ${data.text.length} chars\n`);
    } else {
      console.log("❌ Backend /read-pdf: Error -", data.error, "\n");
    }
  } catch (err) {
    console.log("❌ Backend /read-pdf: Connection failed -", err.message, "\n");
  }

  // Test 3: Backend /generate-from-pdf endpoint
  console.log("3️⃣ Testing Backend /generate-from-pdf (port 5000)...");
  try {
    const genRes = await fetch("http://localhost:5000/generate-from-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_url: "https://github.com/sowmyabethina/mcp/blob/main/sample.pdf" })
    });
    const data = await genRes.json();
    if (genRes.ok && data.questions) {
      console.log("✅ Backend /generate-from-pdf: OK");
      console.log(`   Generated questions length: ${data.questions.length} chars\n`);
    } else {
      console.log("❌ Backend /generate-from-pdf: Error -", data.error, "\n");
    }
  } catch (err) {
    console.log("❌ Backend /generate-from-pdf: Connection failed -", err.message, "\n");
  }

  // Test 4: Frontend accessibility
  console.log("4️⃣ Testing Frontend (port 3000)...");
  try {
    const frontRes = await fetch("http://localhost:3000");
    if (frontRes.ok) {
      console.log("✅ Frontend: OK\n");
    } else {
      console.log("❌ Frontend: Status", frontRes.status, "\n");
    }
  } catch (err) {
    console.log("❌ Frontend: Connection failed -", err.message, "\n");
  }

  console.log("📊 All tests complete!");
}

testServices();
