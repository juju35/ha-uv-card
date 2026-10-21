// Bundles src/ha-uv-card.js into the single HACS file dist/ha-uv-card.js,
// stamping the version and inlining the icons from icons/.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const svg = (name) => readFileSync(`${root}icons/${name}.svg`, "utf8").trim();

const icons = {};
for (let i = 0; i <= 11; i++) icons[i] = svg(`uv-index-${i}`);
icons.default = svg("uv-index");

const out = readFileSync(`${root}src/ha-uv-card.js`, "utf8")
  .replace("__VERSION__", pkg.version)
  .replace("__ICONS__", JSON.stringify(icons, null, 2));

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/ha-uv-card.js`, out);
console.log(`Built dist/ha-uv-card.js (${(out.length / 1024).toFixed(1)} KB)`);
