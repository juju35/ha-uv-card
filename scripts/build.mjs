// Bundles src/ha-uv-card.js into the single HACS file dist/ha-uv-card.js,
// stamping the version and inlining the icons from icons/.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitDist } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const svg = (name) => readFileSync(`${root}icons/${name}.svg`, "utf8").trim();

const icons = {};
for (let i = 0; i <= 11; i++) icons[i] = svg(`uv-index-${i}`);
icons.default = svg("uv-index");

// Function replacers: a literal string replacement would interpret "$" patterns
// ($&, $$, $1...) in the version or the inlined SVGs and corrupt the output.
const out = readFileSync(`${root}src/ha-uv-card.js`, "utf8")
  .replace("__VERSION__", () => pkg.version)
  .replace("__ICONS__", () => JSON.stringify(icons, null, 2));

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/ha-uv-card.js`, out);
console.log(`Built dist/ha-uv-card.js (${(out.length / 1024).toFixed(1)} KB)`);

// Translations: English stays in the bundle, each other language goes to dist/ha-uv-card.i18n.<lang>.js,
// fetched when a card needs it (scripts/i18n-split.mjs).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) splitDist(`${root}dist`, "ha-uv-card.js", { version: pkg.version });
