// Writes a capture only when its decoded pixels differ from the file already
// there: re-encoding the same image (another libpng, Chromium or ffmpeg build)
// changes the bytes, not the picture, and must not touch the file.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// samePixels(oldBytes, newBytes) -> Promise<boolean>, comparing decoded pixels.
// Returns true when the file was (re)written.
export async function writeIfChanged(file, bytes, samePixels) {
  if (existsSync(file) && (await samePixels(readFileSync(file), bytes))) return false;
  writeFileSync(file, bytes);
  return true;
}

// Decodes two PNGs in a Playwright page and compares every channel of every
// pixel (R, G, B and A): opaque captures of different colors are different.
export async function samePngPixels(page, a, b) {
  return page.evaluate(
    async ([a, b]) => {
      const decode = async (b64) => {
        // Raw pixels: no color management (gAMA / sRGB chunks differ between
        // encoders) and no alpha premultiplication.
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob(), {
          colorSpaceConversion: "none",
          premultiplyAlpha: "none",
        });
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d", { colorSpace: "srgb" });
        ctx.drawImage(bitmap, 0, 0);
        return { w: bitmap.width, h: bitmap.height, data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data };
      };
      const [x, y] = await Promise.all([decode(a), decode(b)]);
      if (x.w !== y.w || x.h !== y.h) return false;
      for (let i = 0; i < x.data.length; i++) if (x.data[i] !== y.data[i]) return false;
      return true;
    },
    [a.toString("base64"), b.toString("base64")]
  );
}

// Every frame of a GIF as raw RGBA (needs ffmpeg), so two encodes of the same
// animation compare equal and any color change in any frame does not.
export const gifPixels = (bytes) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-f", "gif", "-i", "pipe:0", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"], {
    input: bytes,
    maxBuffer: 1 << 30,
  });
export const sameGifPixels = async (a, b) => gifPixels(a).equals(gifPixels(b));
