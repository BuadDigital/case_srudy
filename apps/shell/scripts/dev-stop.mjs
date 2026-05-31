import { execSync } from "node:child_process";

const ports = (process.argv[2] ?? "3000,5160").split(",").map((p) => p.trim());

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
      encoding: "utf8",
    });
    const pids = new Set();
    for (const line of out.split("\n")) {
      const match = line.trim().match(/\s+(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }
    for (const pid of pids) {
      console.log(`  Stopping PID ${pid} (port ${port})`);
      execSync(`taskkill /F /PID ${pid}`, { stdio: "inherit" });
    }
    if (pids.size === 0) console.log(`  Port ${port}: nothing listening`);
  } catch {
    console.log(`  Port ${port}: nothing listening`);
  }
}

console.log("");
console.log("  Stopping dev servers…");
console.log("");
for (const port of ports) killPort(port);
console.log("");
