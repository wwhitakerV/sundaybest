import { WORD } from "../wordmark";
import type { WaterScene } from "./scene";
import type { Tile } from "./textures";

/**
 * Skia works a custom shader filter out one unit of its layer to one pixel, and
 * only then scales it up: so the water's glass is worked out in the screen's own
 * pixels (`pr` of them to a point), never in points or the wordmark's units,
 * or it would be drawn a third as sharp (in points) or a few pixels tall (a letter).
 */

/** A tile in points, in the screen's pixels. */
export function pointsToPixels(tile: Tile, pr: number): Tile {
  "worklet";
  return { x: tile.x * pr, y: tile.y * pr, w: tile.w * pr, h: tile.h * pr };
}

/**
 * A tile in the wordmark's units, in the screen's pixels: where the word is
 * written, carried down `dy` points with its letter as it falls.
 */
export function letterToPixels(scene: WaterScene, tile: Tile, dy: number, pr: number): Tile {
  "worklet";
  const { cx, cy, ws } = scene.world;
  return {
    x: (cx + (tile.x - WORD.width / 2) * ws) * pr,
    y: (cy + (tile.y - WORD.height / 2) * ws + dy) * pr,
    w: tile.w * ws * pr,
    h: tile.h * ws * pr,
  };
}

/** How far a letter's corners can swing as it tilts while falling (up to 8°), of its size. */
const TILT_ROOM = 0.15;

/**
 * The box a letter's water is worked out in, in the screen's pixels: its region
 * (in the wordmark's units) where it is on the screen, with room for its tilt.
 */
export function letterBox(
  scene: WaterScene,
  region: { x: number; y: number; width: number; height: number },
  dy: number,
  pr: number,
) {
  "worklet";
  const box = letterToPixels(
    scene,
    { x: region.x, y: region.y, w: region.width, h: region.height },
    dy,
    pr,
  );
  const room = TILT_ROOM * Math.max(box.w, box.h);
  return { x: box.x - room, y: box.y - room, width: box.w + 2 * room, height: box.h + 2 * room };
}

type Box = { x: number; y: number; width: number; height: number };

/** The smallest box covering every box given; null when there are none. */
export function unionBox(boxes: readonly Box[]): Box | null {
  "worklet";
  if (!boxes.length) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const b of boxes) {
    left = Math.min(left, b.x);
    top = Math.min(top, b.y);
    right = Math.max(right, b.x + b.width);
    bottom = Math.max(bottom, b.y + b.height);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}
