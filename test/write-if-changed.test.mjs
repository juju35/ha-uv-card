// The screenshot scripts only rewrite a capture whose decoded pixels changed:
// a re-encode of the same image (another libpng, ffmpeg or Chromium build)
// must not show up as a modified file in a pull request.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { writeIfChanged } from "../scripts/write-if-changed.mjs";

// Stand-in decoder: the "pixels" are the bytes after a 4-byte header that
// changes with every encode.
const pixels = (bytes) => bytes.subarray(4).toString("hex");
const samePixels = async (a, b) => pixels(a) === pixels(b);

test("a capture with the same pixels but other bytes is left untouched", async () => {
  const dir = mkdtempSync(join(tmpdir(), "uv-shot-"));
  try {
    const file = join(dir, "card.png");
    writeFileSync(file, Buffer.from("AAAApixels"));
    const before = statSync(file).mtimeMs;
    assert.equal(await writeIfChanged(file, Buffer.from("BBBBpixels"), samePixels), false);
    assert.equal(readFileSync(file, "utf8"), "AAAApixels");
    assert.equal(statSync(file).mtimeMs, before);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("a capture whose pixels changed, or a new one, is written", async () => {
  const dir = mkdtempSync(join(tmpdir(), "uv-shot-"));
  try {
    const file = join(dir, "card.png");
    assert.equal(await writeIfChanged(file, Buffer.from("AAAAfirst"), samePixels), true);
    assert.equal(readFileSync(file, "utf8"), "AAAAfirst");
    assert.equal(await writeIfChanged(file, Buffer.from("AAAAsecond"), samePixels), true);
    assert.equal(readFileSync(file, "utf8"), "AAAAsecond");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("the still and GIF scripts write their captures through writeIfChanged", () => {
  for (const script of ["screenshots.mjs", "gifs.mjs"]) {
    const src = readFileSync(new URL(`../scripts/${script}`, import.meta.url), "utf8");
    assert.match(src, /writeIfChanged\(/, `${script} does not use writeIfChanged`);
    assert.doesNotMatch(src, /path:\s*`\$\{root\}screenshots\//, `${script} writes a screenshot straight into screenshots/`);
    assert.doesNotMatch(src, /"-loop", "0", `\$\{root\}screenshots\//, `${script} has ffmpeg write the GIF in place`);
  }
});

// The PNG comparison decodes raw pixels: with color management on, Chromium
// converted the committed PNGs and an unchanged card compared as changed.
test("the PNG comparison decodes raw pixels, without color conversion", () => {
  const src = readFileSync(new URL("../scripts/screenshots.mjs", import.meta.url), "utf8");
  assert.match(src, /colorSpaceConversion:\s*"none"/);
  assert.match(src, /premultiplyAlpha:\s*"none"/);
});
