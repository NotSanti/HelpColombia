/**
 * MapLibre v6 workers import maplibre-gl-shared.mjs by relative path.
 * Next.js/Turbopack does not place that sibling next to the worker bundle,
 * so we copy both files into public/maplibre for setWorkerUrl().
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "node_modules", "maplibre-gl", "dist");
const destDir = path.join(root, "public", "maplibre");
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

fs.mkdirSync(destDir, { recursive: true });
for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
}
console.log(
  `Copied MapLibre worker assets → public/maplibre (${files.join(", ")})`,
);
