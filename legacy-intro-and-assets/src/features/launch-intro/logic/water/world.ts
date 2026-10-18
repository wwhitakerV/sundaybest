import { mulberry32 } from "@/utils/random/mulberry32";
import { GRAVITY, PROTOTYPE_WIDTH, type Stage } from "../settings";
import type { StrokeTiming } from "../strokes";
import { BOTTOM_EDGE, LETTER_X, LETTERS, WORD } from "../wordmark";
import { fallTime, landDrips, type Draw } from "./world-drips";
import { wallHitAt, wallSurge, type Pour } from "./pour";
import type { WaterSettings } from "./settings";
import type { WaterWorld } from "./world-types";

/** The seed the prototype was tuned with: the same splash, every launch. */
const SEED = 99;

/** The eruption: the thrown wall's shed drops, the crown's strands and the central jet. */
function eruptionDrops(
  r: Draw,
  rnd: () => number,
  sx: number,
  wordLeft: number,
  wordRight: number,
) {
  const edge = Array.from({ length: 230 }, () => ({
    x: r(-10 * sx, 400 * sx),
    at: r(0.04, 0.96),
    up: r(0.03, 0.22),
    vx: r(-0.45, 0.45),
    r: r(3, 8.5),
  }));
  const strands = Array.from({ length: 26 }, () => {
    const side = rnd() < 0.5 ? -1 : 1;
    return {
      x: r(wordLeft - 10, wordRight + 10),
      ang: side * r(0.35, 1.2),
      v: r(1.4, 2.4),
      dt: r(0, 90),
      beads: Array.from({ length: 7 }, (_, k) => ({
        k: 1 - k * r(0.03, 0.055),
        r: r(3.5, 7) * (1 - k * 0.08),
      })),
    };
  });
  const jet = Array.from({ length: 44 }, (_, i) => ({
    dx: r(-13, 13),
    dt: 40 + i * 4.5 + r(0, 8),
    v: r(3.4, 4.4),
    r: r(5, 11),
  }));
  return { edge, strands, jet };
}

/**
 * Everything in the water intro, worked out once: the pool pouring in and
 * slamming into the far wall, the drips and the pool they raise, the letters
 * falling in, every drop of the eruption, and the drain. A port of the v4
 * prototype that keeps its random sequence, so it plays out exactly as it was
 * tuned; positions across the screen scale with its width.
 */
export function buildWaterWorld(
  settings: WaterSettings,
  stage: Stage,
  strokes: readonly StrokeTiming[],
  write: { start: number; dur: number },
  fallStart: number,
): WaterWorld {
  const { height: H } = stage;
  const sx = stage.width / PROTOTYPE_WIDTH;
  const rnd = mulberry32(SEED);
  const r: Draw = (a, b) => a + (b - a) * rnd();
  const ws = Math.min(settings.writeWidth, stage.width - 40) / WORD.width;
  const cx = stage.width / 2;
  const cy = H / 2;
  const toX = (u: number) => cx + (u - WORD.width / 2) * ws;
  const yb = cy + (BOTTOM_EDGE - WORD.height / 2) * ws;
  const pour: Pour = {
    ms: settings.pourMs,
    depth: (settings.poolPct / 100) * H,
    width: stage.width,
    sx,
  };

  const { drips, perVolume, surface, landing } = landDrips(
    settings,
    stage,
    strokes,
    { toX, ws, yb, write, fallStart },
    pour,
    { r, rnd },
  );

  // The letters drop in a random order, the middle ones a touch ahead: a barely-there U.
  // Each keeps falling as it pours in, and is all water once its top reaches the surface.
  const top = cy - (WORD.height / 2) * ws;
  const falls = LETTERS.map((_, i) => {
    const mid = 1 - ((i - 4.5) / 4.5) ** 2;
    const start = fallStart + r(0, 70) + 110 * (1 - mid);
    const [left, right] = LETTER_X[i] ?? [0, 0];
    const letterX = (left + right) / 2;
    const hit = landing(start, yb, GRAVITY.letter);
    const gone = start + fallTime(top, H - surface(hit) + 6, GRAVITY.letter);
    return { start, hit, gone, rot: r(-8, 8), cx: letterX, x: toX(letterX) };
  });

  const impacts = drips
    .map((d) => ({ t: d.th, x: d.x, amp: 2 + d.r * 0.9, w: 60 }))
    .concat(falls.map((f) => ({ t: f.hit, x: f.x, amp: 18, w: 110 })));
  // Where each letter pours in, the water heaves up in answer and settles…
  const heaves = falls.map((f) => ({ t: f.hit, x: f.x, A: 30, w: 30 }));
  // …and throws up a crown of spray.
  const spray = falls.flatMap((f) =>
    Array.from({ length: 6 }, () => ({
      t0: f.hit,
      y0: H - surface(f.hit),
      x: f.x + r(-18, 18),
      vx: r(-0.3, 0.3),
      vy: -r(0.4, 0.95),
      r: r(3, 6),
    })),
  );
  // The pour's front slamming into the left wall throws spray up it and off it.
  const hitWall = wallHitAt(pour);
  for (let k = 0; k < 16; k++) {
    const t0 = hitWall + settings.pourMs * r(0.03, 0.12);
    const x = r(1, 26) * sx;
    spray.push({
      t0,
      y0: H - surface(t0) - wallSurge(pour, x, t0) + 4,
      x,
      vx: r(0.04, 0.38),
      vy: -r(0.4, 0.85),
      r: r(2.5, 6.5),
    });
  }

  const sheetPhase = Array.from({ length: 4 }, () => r(0, 6.28));
  const wordLeft = Math.min(...falls.map((f) => f.x));
  const wordRight = Math.max(...falls.map((f) => f.x));
  const splash = eruptionDrops(r, rnd, sx, wordLeft, wordRight);
  // As the drained water leaves the bottom, a few drops barely pop back up, like a coin
  // dropped into water, then fall out through the bottom of the phone.
  const pops = Array.from({ length: 5 }, () => ({
    x: r(40, 350) * sx,
    h: r(18, 70),
    r: r(3.5, 7),
    delay: r(0, 90),
  }));
  const drain = {
    phase: Array.from({ length: 3 }, () => r(0, 6.28)),
    shed: Array.from({ length: 110 }, () => ({
      x: r(-6, 396) * sx,
      at: r(0.04, 0.8),
      lag: r(0.6, 0.92),
      vx: r(-0.12, 0.12),
      r: r(3, 8),
    })),
  };

  return {
    ws,
    cx,
    cy,
    yb,
    height: H,
    sx,
    drips,
    perVolume,
    poolH: pour.depth,
    volumeFromDrip: settings.waterVolumeFromDrip,
    pour,
    falls,
    impacts,
    heaves,
    spray,
    sheetPhase,
    splash,
    pops,
    drain,
  };
}
