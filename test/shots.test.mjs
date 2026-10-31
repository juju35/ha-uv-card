// The README shows the still shots as light | dark pairs: each pair must show
// the same card state, only the theme may differ.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SHOTS } from "../scripts/shots.mjs";

const strip = ({ file, theme, ...rest }) => rest;

test("every still shot has a dark twin with the same state", () => {
  const byFile = new Map(SHOTS.map((s) => [s.file, s]));
  const light = SHOTS.filter((s) => s.theme === "light");
  assert.ok(light.length > 0);
  for (const s of light) {
    const dark = byFile.get(`${s.file}-dark`);
    assert.ok(dark, `${s.file}-dark is missing`);
    assert.equal(dark.theme, "dark", `${s.file}-dark theme`);
    assert.deepEqual(strip(dark), strip(s), `${s.file} and ${s.file}-dark differ beyond the theme`);
  }
  assert.equal(SHOTS.filter((s) => s.theme === "dark").length, light.length, "a dark shot has no light twin");
});

test("every light | dark pair of the README is a pair of rendered shots", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const files = new Set(SHOTS.map((s) => s.file));
  const rows = [...readme.matchAll(/screenshots\/([\w-]+)\.png\).*screenshots\/([\w-]+)\.png\)/g)];
  assert.ok(rows.length > 0);
  for (const [, light, dark] of rows) {
    assert.equal(dark, `${light}-dark`, `README row ${light} | ${dark}`);
    assert.ok(files.has(light) && files.has(dark), `README row ${light} | ${dark} is not rendered`);
  }
});
