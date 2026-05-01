import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const extensionDir = join(root, "extension");
const manifestPath = join(extensionDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const required = [
  "manifest.json",
  manifest.action?.default_popup,
  manifest.background?.service_worker,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
].filter(Boolean);

for (const file of required) {
  await access(join(extensionDir, file), constants.R_OK);
}

if (manifest.manifest_version !== 3) {
  throw new Error("manifest_version must be 3");
}

for (const permission of ["activeTab", "scripting"]) {
  if (!manifest.permissions?.includes(permission)) {
    throw new Error(`permissions must include ${permission}`);
  }
}

console.log("Extension manifest is valid.");
