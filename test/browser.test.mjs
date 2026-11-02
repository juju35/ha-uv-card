// Browser tests (Chromium through Playwright): the layout in the parents a
// dashboard really uses, and the ResizeObserver in a card without a fixed height.
// Skipped when Chromium is not installed (the unit-test job), unless
// REQUIRE_BROWSER=1 (the screenshots job, which installs it): there a missing
// browser fails instead of skipping.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

const source = readFileSync(new URL("../src/ha-uv-card.js", import.meta.url), "utf8")
  .replace("__VERSION__", () => "test")
  .replace("__ICONS__", () => "{}");

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.REQUIRE_BROWSER === "1") throw err;
    skip = `no Chromium (${String(err.message).split("\n")[0]})`;
  }
});
after(() => browser?.close());

// Stand-ins for Home Assistant's <ha-card> (a block with a 1px border) and <ha-icon>.
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --primary-text-color: #212121; --secondary-text-color: #727272; --card-background-color: #fff; }
  body { margin: 0; font-family: Arial, sans-serif; }
</style></head><body><div id="root"></div><script>
customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;border:1px solid #e0e0e0}</style><slot></slot>";
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  connectedCallback() { this.style.cssText = "display:inline-block;width:24px;height:24px"; }
});
</script></body></html>`;

async function page(t) {
  if (skip) {
    t.skip(skip);
    return null;
  }
  const p = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  p.on("pageerror", (err) => errors.push(err.message));
  await p.setContent(PAGE);
  // ResizeObserver loop errors are reported on window, not as uncaught exceptions.
  await p.evaluate(() => {
    window.__errors = [];
    window.addEventListener("error", (ev) => window.__errors.push(ev.message));
  });
  await p.addScriptTag({ content: source });
  p.errors = async () => [...errors, ...(await p.evaluate(() => window.__errors))];
  return p;
}

// Parents that size the card: shrink-to-fit ones (inline-block, a grid "auto"
// column: button-card, layout-card) and a two-column "1fr 1fr" grid (grid
// card, layout-card) at phone and tablet widths; the card directly in the
// parent or wrapped in a <div> (a min-width:auto grid item) as some cards do.
const CONTEXTS = [
  ["inline-block", null],
  ["grid auto", null],
  ["1fr 1fr", 320],
  ["1fr 1fr", 360],
  ["1fr 1fr", 500],
];

test("in shrink-to-fit parents and 1fr 1fr grids, directly or in a div, the card neither overflows nor collapses", async (t) => {
  const p = await page(t);
  if (!p) return;
  const failures = [];
  for (const layout of ["horizontal", "vertical"])
    for (const lang of ["en", "pl", "sr-Latn"])
      for (const [ctx, width] of CONTEXTS)
        for (const wrap of [false, true]) {
          const r = await p.evaluate(
            async ({ layout, lang, ctx, width, wrap }) => {
              const root = document.getElementById("root");
              root.innerHTML = "";
              const box = root.appendChild(document.createElement("div"));
              if (ctx === "inline-block") box.style.display = "inline-block";
              else if (ctx === "grid auto") box.style.cssText = "display:grid;grid-template-columns:auto;justify-content:start";
              else box.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:8px;width:${width}px`;
              const cards = [];
              for (let i = 0; i < (width ? 2 : 1); i++) {
                const el = document.createElement("ha-uv-card");
                el.setConfig({ entity: "sensor.uv", layout });
                el.hass = { language: lang, states: { "sensor.uv": { state: "9", attributes: { friendly_name: "UV index Rennes" } } } };
                (wrap ? box.appendChild(document.createElement("div")) : box).appendChild(el);
                cards.push(el.shadowRoot.querySelector("ha-card"));
              }
              await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
              const right = box.getBoundingClientRect().right;
              return {
                widths: cards.map((c) => Math.round(c.getBoundingClientRect().width)),
                overflow: Math.max(...cards.map((c) => c.getBoundingClientRect().right - right)),
              };
            },
            { layout, lang, ctx, width, wrap }
          );
          const name = `${layout} ${lang} ${ctx}${width ? ` ${width}px` : ""} ${wrap ? "in a div" : "direct"}`;
          if (width && r.overflow > 0.5) failures.push(`${name}: ${Math.round(r.overflow)}px past the grid`);
          // A shrink-to-fit parent gives the card a usable width, not its padding (~26px).
          if (!width && Math.min(...r.widths) < 200) failures.push(`${name}: ${r.widths}px wide`);
          // In a 1fr 1fr grid each card gets its half of the row.
          if (width && Math.min(...r.widths) < (width - 8) / 2 - 1) failures.push(`${name}: ${r.widths}px wide`);
        }
  assert.deepEqual(await p.errors(), []);
  await p.close();
  assert.deepEqual(failures, []);
});

// Masonry view or a vertical stack: the card height follows its content, so the
// risk level switching between its text and its dot changes the card height.
// Refitting it inside the ResizeObserver callback made the observed element
// change size again in the same frame: "ResizeObserver loop completed with
// undelivered notifications" on window at every switch.
test("the risk level switches between text and dot in a card without a fixed height, without a ResizeObserver loop", async (t) => {
  const p = await page(t);
  if (!p) return;
  const dots = await p.evaluate(async () => {
    const frames = (n) => new Promise((r) => {
      const step = () => (n-- > 0 ? requestAnimationFrame(step) : r());
      step();
    });
    const box = document.getElementById("root").appendChild(document.createElement("div"));
    box.style.width = "300px";
    const el = box.appendChild(document.createElement("ha-uv-card"));
    el.setConfig({ entity: "sensor.uv" });
    el.hass = { language: "pl", states: { "sensor.uv": { state: "9", attributes: {} } } };
    const label = el.shadowRoot.querySelector(".label");
    const seen = [];
    for (const w of [300, 80, 300, 80, 300]) {
      box.style.width = `${w}px`;
      await frames(4);
      seen.push(label.hasAttribute("data-dot"));
    }
    // A level change at the narrow width is re-fitted too.
    box.style.width = "80px";
    await frames(4);
    el.hass = { language: "pl", states: { "sensor.uv": { state: "1", attributes: {} } } };
    await frames(4);
    seen.push(label.hasAttribute("data-dot"));
    el.hass = { language: "pl", states: { "sensor.uv": { state: "9", attributes: {} } } };
    await frames(4);
    seen.push(label.hasAttribute("data-dot"));
    return seen;
  });
  // "Bardzo wysoki" fits at 300px, not at 80px; "Niski" fits at 80px.
  assert.deepEqual(dots, [false, true, false, true, false, false, true]);
  assert.deepEqual(await p.errors(), []);
  await p.close();
});

// The capture scripts rewrite a screenshot only when its decoded pixels
// changed. A comparison that only looked at the alpha channel would call two
// opaque captures of different colors identical and keep a stale file: the
// real decoders are run on real opaque images here.
async function solidPng(p, color, viaCanvas = false) {
  if (!viaCanvas) {
    await p.setContent(`<body style="margin:0;background:${color}"></body>`);
    return p.screenshot({ clip: { x: 0, y: 0, width: 16, height: 16 } });
  }
  const bytes = await p.evaluate(async (color) => {
    const canvas = new OffscreenCanvas(16, 16);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    return [...new Uint8Array(await blob.arrayBuffer())];
  }, color);
  return Buffer.from(bytes);
}

test("the PNG comparison sees colors: opaque captures of different colors are rewritten", async (t) => {
  const p = await page(t);
  if (!p) return;
  const { samePngPixels, writeIfChanged } = await import("../scripts/write-if-changed.mjs");
  const red = await solidPng(p, "rgb(255, 0, 0)");
  const blue = await solidPng(p, "rgb(0, 0, 255)");
  const nearRed = await solidPng(p, "rgb(255, 0, 1)");
  const redAgain = await solidPng(p, "rgb(255, 0, 0)", true); // another encoder, other bytes
  assert.notDeepEqual(red, redAgain, "the two red encodes should differ in bytes");
  assert.equal(await samePngPixels(p, red, blue), false, "red vs blue");
  assert.equal(await samePngPixels(p, red, nearRed), false, "one blue level apart");
  assert.equal(await samePngPixels(p, red, redAgain), true, "same red, re-encoded");
  const { mkdtempSync, readFileSync, rmSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "uv-png-"));
  try {
    const file = join(dir, "card.png");
    writeFileSync(file, red);
    const same = (a, b) => samePngPixels(p, a, b);
    assert.equal(await writeIfChanged(file, redAgain, same), false, "a re-encode is not rewritten");
    assert.deepEqual(readFileSync(file), red);
    assert.equal(await writeIfChanged(file, blue, same), true, "another color is rewritten");
    assert.deepEqual(readFileSync(file), blue);
  } finally {
    rmSync(dir, { recursive: true });
  }
  await p.close();
});

test("the GIF comparison sees colors in every frame", async (t) => {
  const { execFileSync } = await import("node:child_process");
  const gif = (frames) =>
    execFileSync("ffmpeg", [
      "-loglevel", "error", "-f", "lavfi", "-i", `color=c=red:s=16x16:r=2:d=${frames.length / 2}`,
      "-vf", frames.map((c, i) => `drawbox=c=${c}:t=fill:enable='eq(n,${i})'`).join(","),
      "-f", "gif", "pipe:1",
    ]);
  try {
    execFileSync("ffmpeg", ["-version"]);
  } catch (err) {
    if (process.env.REQUIRE_BROWSER === "1") throw err;
    t.skip("no ffmpeg");
    return;
  }
  const { sameGifPixels } = await import("../scripts/write-if-changed.mjs");
  const redBlue = gif(["red", "blue"]);
  assert.equal(await sameGifPixels(redBlue, gif(["red", "blue"])), true, "same animation");
  assert.equal(await sameGifPixels(redBlue, gif(["red", "green"])), false, "the second frame changed color");
  assert.equal(await sameGifPixels(gif(["red"]), gif(["blue"])), false, "red vs blue");
});
