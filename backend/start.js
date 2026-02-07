import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

function startServer() {
  console.log(`[${new Date().toISOString()}] Starting backend server...`);
  
  const server = spawn("node", ["index.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  server.on("exit", (code) => {
    console.error(
      `[${new Date().toISOString()}] ❌ Server crashed with code ${code}`
    );
    console.log(
      `[${new Date().toISOString()}] Restarting in 2 seconds...`
    );
    setTimeout(startServer, 2000);
  });

  server.on("error", (err) => {
    console.error(
      `[${new Date().toISOString()}] ❌ Server error:`,
      err.message
    );
    setTimeout(startServer, 2000);
  });
}

startServer();
