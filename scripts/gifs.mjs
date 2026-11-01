// Records one animated GIF of the card per WHO risk band into screenshots/uv-<band>.gif and its dark twin uv-<band>-dark.gif (needs ffmpeg).
// Usage: npm run build && npm run gifs
// The icons animate with SMIL (<animateTransform>), which the Web Animations API does not
// cover: the SVG document clock is paused and stepped frame by frame, so every GIF loops
// cleanly whatever the machine's speed.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { icons, render, uv } from "./screenshots.mjs";
import { writeIfChanged } from "./write-if-changed.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const WIDTH = 460;
const FPS = 15;
const SECONDS = 6; // one <animateTransform dur="6s"> cycle; the 8-fold ray pattern makes the 45° sweep seamless

// One value per WHO band, matching the README's "Risk levels" table.
const BANDS = [
  { file: "uv-low", value: 1 },
  { file: "uv-moderate", value: 4 },
  { file: "uv-high", value: 7 },
  { file: "uv-very-high", value: 9 },
  { file: "uv-extreme", value: 11 },
];

// Every frame of a GIF as raw RGBA, so two encodes of the same animation compare equal.
const gifPixels = (bytes) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-f", "gif", "-i", "pipe:0", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"], {
    input: bytes,
    maxBuffer: 1 << 30,
  });
const sameGifPixels = async (a, b) => gifPixels(a).equals(gifPixels(b));

const captureGif = (file) => async (page, clip) => {
  await page.evaluate(() => {
    const svg = document.querySelector("ha-uv-card").shadowRoot.querySelector(".icon svg");
    svg.pauseAnimations();
    window.__uvSvg = svg;
  });
  const dir = mkdtempSync(join(tmpdir(), "uv-frames-"));
  const frames = FPS * SECONDS;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__uvSvg.setCurrentTime(t), (i * SECONDS) / frames);
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
      hass: { states: uv(value) },
      capture: captureGif(`${file}${suffix}`),
    }))
  ),
  { icons }
);
