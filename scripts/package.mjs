import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const extensionDir = join(root, "extension");
const distDir = join(root, "dist");
const zipPath = join(distDir, "agent-view-extension.zip");

await mkdir(distDir, { recursive: true });
await rm(zipPath, { force: true });

await new Promise((resolve, reject) => {
  const child = spawn("zip", ["-r", zipPath, ".", "-x", "icons/icon-source.svg"], {
    cwd: extensionDir,
    stdio: "inherit",
  });

  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`zip exited with code ${code}`));
  });
});

console.log(`Packaged ${zipPath}`);
