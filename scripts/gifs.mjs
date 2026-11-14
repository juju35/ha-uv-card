// Records one animated GIF of the card per WHO risk band into screenshots/uv-<band>.gif and its dark twin uv-<band>-dark.gif (needs ffmpeg).
// Usage: npm run build && npm run gifs
// Each GIF starts at UV 0, then the value is set: the marker glides along the gauge to it, the bands
// above it dim, the colours follow (CSS transitions) and, at Very high and Extreme, the marker pulses
// (CSS animation). The badge icon animates with SMIL (<animateTransform>), which the Web Animations API
// does not cover: the SVG document clock and the CSS animations are both paused and stepped frame by
// frame, so every GIF is the same whatever the machine's speed.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { icons, render, uv } from "./screenshots.mjs";
import { sameGifPixels, writeIfChanged } from "./write-if-changed.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const WIDTH = 360;
const FPS = 15;
// One <animateTransform dur="6s"> cycle (the 8-fold ray pattern makes the 45° sweep seamless) and two 3 s pulses.
const SECONDS = 6;

// One value per WHO band, matching the README's "Risk levels" table.
const BANDS = [
  { file: "uv-low", value: 1 },
  { file: "uv-moderate", value: 4 },
  { file: "uv-high", value: 7 },
  { file: "uv-very-high", value: 9 },
  { file: "uv-extreme", value: 11 },
];

const captureGif = (file, value) => async (page, clip) => {
  await page.evaluate((states) => {
    const el = document.querySelector("ha-uv-card");
    el.hass = { ...el._hass, states };
    const root = el.shadowRoot;
    // Start the transitions now, then hold every clock: the frames below set them.
    getComputedStyle(root.querySelector(".marker")).transform;
    window.__uvAnims = root.getAnimations();
    for (const a of window.__uvAnims) a.pause();
    const svg = root.querySelector(".icon svg");
    svg.pauseAnimations();
    window.__uvSvg = svg;
  }, uv(value));
  const dir = mkdtempSync(join(tmpdir(), "uv-frames-"));
  const frames = FPS * SECONDS;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => {
      window.__uvSvg.setCurrentTime(t);
      // The transitions start after a short hold at 0; the pulse runs from the first frame.
      for (const a of window.__uvAnims) a.currentTime = (a instanceof CSSTransition ? t - 0.5 : t) * 1000;
    }, (i * SECONDS) / frames);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  // deviceScaleFactor is 2: scale back to CSS pixels and build a palette for a small, clean GIF.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", join(dir, "out.gif"),
  ]);
  // Only rewritten when a frame changed, so an unchanged animation leaves the file alone.
  const written = await writeIfChanged(`${root}screenshots/${file}.gif`, readFileSync(join(dir, "out.gif")), sameGifPixels);
  rmSync(dir, { recursive: true });
  console.log(`screenshots/${file}.gif${written ? "" : " (unchanged)"}`);
};

// Each band in both themes with the same setup: uv-<band>.gif light, uv-<band>-dark.gif dark.
const THEMES = [
  { theme: "light", suffix: "" },
  { theme: "dark", suffix: "-dark" },
];

await render(
  BANDS.flatMap(({ file, value }) =>
    THEMES.map(({ theme, suffix }) => ({
      file: `${file}${suffix}`,
      type: "ha-uv-card",
      theme,
      width: WIDTH,
      config: { entity: "sensor.uv_index" },
      hass: { states: uv(0) },
      capture: captureGif(`${file}${suffix}`, value),
    }))
  ),
  { icons }
);
