// Writes a capture only when its decoded pixels differ from the file already
// there: re-encoding the same image (another libpng, Chromium or ffmpeg build)
// changes the bytes, not the picture, and must not touch the file.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// samePixels(oldBytes, newBytes) -> Promise<boolean>, comparing decoded pixels.
// Returns true when the file was (re)written.
export async function writeIfChanged(file, bytes, samePixels) {
  if (existsSync(file) && (await samePixels(readFileSync(file), bytes))) return false;
  writeFileSync(file, bytes);
  return true;
}
