import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function pythonExecutable() {
  const candidates = [
    path.join(root, "backend", ".venv", "Scripts", "python.exe"),
    path.join(root, "backend", ".venv", "bin", "python"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

function runPythonModule(moduleArgs) {
  const result = spawnSync(pythonExecutable(), ["-m", ...moduleArgs], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-backend-tool.mjs <black|ruff> [...args]");
  process.exit(1);
}

const tool = args[0];
const toolArgs = args.slice(1);

if (tool === "black") {
  runPythonModule(["black", ...toolArgs]);
}

if (tool === "ruff") {
  runPythonModule(["ruff", ...toolArgs]);
}

console.error(`Unknown backend tool: ${tool}`);
process.exit(1);
