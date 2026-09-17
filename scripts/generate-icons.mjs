#!/usr/bin/env node
// Writes the placeholder app icons in assets/, one per build variant.
//
//   node scripts/generate-icons.mjs
//
// These are placeholders: real artwork is a checklist item before any TestFlight
// or App Store build. Until then the point is that the three variants are
// instantly distinguishable on a home screen, so nobody reports a bug against a
// dev build thinking it was production.
//
// No image dependency. A PNG is a signature, a header chunk, a zlib-deflated
// block of scanlines, and an end chunk — about 60 lines of the below — and one
// script in the repo beats adding an image library to the install graph for
// three placeholder files.
//
// Colour type 2 (RGB, no alpha) is deliberate: Apple rejects app icons that
// carry an alpha channel.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 1024;
const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

/**
 * A 5x7 bitmap font, only the glyphs the badges need. Each string is one row,
 * "1" meaning ink. Drawn at a large scale, so the blockiness reads as a
 * deliberate placeholder rather than a broken asset.
 */
const GLYPHS = {
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
};

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;
const GLYPH_GAP = 1;

/** One icon per variant. `badge` is null for production — see the ADR. */
const VARIANTS = [
  {
    file: "icon.png",
    background: [26, 35, 71], // deep indigo
    ink: [255, 255, 255],
    badge: null,
    badgeBackground: null,
  },
  {
    file: "icon-development.png",
    background: [122, 52, 14], // burnt orange
    ink: [255, 245, 230],
    badge: "DEV",
    badgeBackground: [232, 124, 34],
  },
  {
    file: "icon-preview.png",
    background: [12, 74, 74], // teal
    ink: [235, 255, 253],
    badge: "PRE",
    badgeBackground: [26, 160, 150],
  },
];

function createCanvas(size, [r, g, b]) {
  const pixels = Buffer.alloc(size * size * 3);
  for (let offset = 0; offset < pixels.length; offset += 3) {
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
  }
  return pixels;
}

function fillRect(pixels, size, x0, y0, width, height, [r, g, b]) {
  const xStart = Math.max(0, x0);
  const yStart = Math.max(0, y0);
  const xEnd = Math.min(size, x0 + width);
  const yEnd = Math.min(size, y0 + height);

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * size + x) * 3;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
    }
  }
}

function textWidth(text, scale) {
  return text.length * GLYPH_WIDTH * scale + (text.length - 1) * GLYPH_GAP * scale;
}

/** Draws `text` with its top-left at (x, y). Unknown characters are skipped. */
function drawText(pixels, size, text, x, y, scale, color) {
  let cursor = x;

  for (const character of text) {
    const glyph = GLYPHS[character];
    if (glyph !== undefined) {
      for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
        for (let column = 0; column < GLYPH_WIDTH; column += 1) {
          if (glyph[row][column] === "1") {
            fillRect(pixels, size, cursor + column * scale, y + row * scale, scale, scale, color);
          }
        }
      }
    }
    cursor += (GLYPH_WIDTH + GLYPH_GAP) * scale;
  }
}

// --- PNG encoding ----------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));

  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); // width
  header.writeUInt32BE(size, 4); // height
  header[8] = 8; // bit depth
  header[9] = 2; // colour type 2 = RGB, no alpha
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // Each scanline is prefixed with its filter type. 0 = none, which costs a few
  // bytes on a file this compressible and keeps the encoder trivial.
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Drawing ---------------------------------------------------------------

function renderIcon({ background, ink, badge, badgeBackground }) {
  const pixels = createCanvas(SIZE, background);

  // "SB" wordmark, centred in the upper two thirds so a bottom badge does not
  // crowd it.
  const markScale = 56;
  const markWidth = textWidth("SB", markScale);
  drawText(
    pixels,
    SIZE,
    "SB",
    Math.round((SIZE - markWidth) / 2),
    Math.round(SIZE * 0.24),
    markScale,
    ink,
  );

  if (badge !== null) {
    const bandHeight = Math.round(SIZE * 0.2);
    const bandTop = SIZE - bandHeight;
    fillRect(pixels, SIZE, 0, bandTop, SIZE, bandHeight, badgeBackground);

    const badgeScale = 18;
    const badgeWidth = textWidth(badge, badgeScale);
    drawText(
      pixels,
      SIZE,
      badge,
      Math.round((SIZE - badgeWidth) / 2),
      bandTop + Math.round((bandHeight - GLYPH_HEIGHT * badgeScale) / 2),
      badgeScale,
      ink,
    );
  }

  return encodePng(pixels, SIZE);
}

mkdirSync(ASSETS_DIR, { recursive: true });

for (const variant of VARIANTS) {
  const png = renderIcon(variant);
  writeFileSync(join(ASSETS_DIR, variant.file), png);
  console.log(`assets/${variant.file}  ${SIZE}x${SIZE}  ${png.length} bytes`);
}
