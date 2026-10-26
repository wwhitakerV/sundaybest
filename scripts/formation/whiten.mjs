#!/usr/bin/env node
// Lifts each of Formation's pathway artworks off its baked-in background onto
// plain white, so the pathway sits on the app's own white page with no box.
//
//   npm run build:formation
//
// For each artwork (assets/formation/form-4 … form-8) it fits the background —
// a smooth wash, light at one corner and warm at the foot — as a cubic surface
// per colour, from the pixels that match it, then divides it out: background
// comes out white, and the pathway keeps its own colour and texture, its soft
// shadow now a grey shadow on white. The last near-white noise is snapped to
// pure white. It writes assets/formation/white/form-N.jpeg, the same size.

import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "assets/formation");
const OUT = join(SOURCE, "white");
const FORMS = [4, 5, 6, 7, 8];
/** Sampled every this many pixels for the fit. */
const STEP = 6;
/** The border band the first fit is made from: only background there. */
const BORDER = 0.05;
/** A sample this close to the fitted background (0–255, per channel on average) counts as background. */
const MATCH = 5;
/** Refits, each from every sample that matches the fit before. */
const PASSES = 4;
/**
 * After dividing out, a pixel this little off white is white — more for the
 * sand artworks (7, 8), whose backgrounds carry a grain the smooth fit can't.
 */
const SNAP = { 4: 5, 5: 5, 6: 5, 7: 9, 8: 10 };

/** The cubic surface's terms at (u, v), both 0–1. */
function terms(u, v) {
  return [1, u, v, u * u, u * v, v * v, u * u * u, u * u * v, u * v * v, v * v * v];
}

/** Least squares: the coefficients best fitting `rows` (terms) to `values`. */
function fit(rows, values) {
  const n = rows[0].length;
  const a = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  rows.forEach((row, k) => {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) a[i][j] += row[i] * row[j];
      a[i][n] += row[i] * values[k];
    }
  });
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1)
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const f = a[r][col] / a[col][col];
      for (let c = col; c <= n; c += 1) a[r][c] -= f * a[col][c];
    }
  }
  return a.map((row, i) => row[n] / row[i]);
}

const at = (coef, t) => coef.reduce((sum, c, i) => sum + c * t[i], 0);

async function whiten(form) {
  const src = join(SOURCE, `form-${form}.jpeg`);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const pixel = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // Every sample, and the border's as the first background.
  const samples = [];
  for (let y = 0; y < h; y += STEP) {
    for (let x = 0; x < w; x += STEP) {
      const u = x / (w - 1);
      const v = y / (h - 1);
      const border = u < BORDER || u > 1 - BORDER || v < BORDER || v > 1 - BORDER;
      samples.push({ t: terms(u, v), rgb: pixel(x, y), border });
    }
  }
  let kept = samples.filter((s) => s.border);
  let coefs = [];
  for (let pass = 0; pass <= PASSES; pass += 1) {
    coefs = [0, 1, 2].map((c) =>
      fit(
        kept.map((s) => s.t),
        kept.map((s) => s.rgb[c]),
      ),
    );
    kept = samples.filter((s) => {
      const off = [0, 1, 2].reduce((sum, c) => sum + Math.abs(s.rgb[c] - at(coefs[c], s.t)), 0) / 3;
      return off < MATCH;
    });
  }

  // Divide the background out; snap what's left of it to white.
  const snap = SNAP[form];
  const out = Buffer.alloc(w * h * 3);
  let borderOff = 0;
  let borderCount = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const t = terms(x / (w - 1), y / (h - 1));
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        const bg = Math.max(1, at(coefs[c], t));
        const lifted = Math.min(255, (255 * data[i + c]) / bg);
        const dark = Math.max(0, 255 - lifted - snap) * (255 / (255 - snap));
        out[i + c] = Math.round(255 - dark);
      }
      if (x < 4 || y < 4 || x >= w - 4 || y >= h - 4) {
        borderOff += 255 * 3 - out[i] - out[i + 1] - out[i + 2];
        borderCount += 3;
      }
    }
  }
  mkdirSync(OUT, { recursive: true });
  const dest = join(OUT, `form-${form}.jpeg`);
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);
  const share = Math.round((kept.length / samples.length) * 100);
  console.log(
    `form-${form}: ${w}×${h}, background ${share}% of it, edge off white by ${(borderOff / borderCount).toFixed(2)}`,
  );
}

for (const form of FORMS) await whiten(form);
