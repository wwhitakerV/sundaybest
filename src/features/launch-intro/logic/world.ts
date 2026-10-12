import { mulberry32 } from "@/utils/random/mulberry32";
import { clamp01, easeOut, mix } from "./ease";
import { GRAVITY, PROTOTYPE_WIDTH, type IntroSettings, type Stage } from "./settings";
import type { StrokeTiming } from "./strokes";
import { BOTTOM_EDGE, BOTTOMS, LETTER_X, LETTERS, WORD } from "./wordmark";
import type { Drip, World } from "./world-types";

/** The seed the prototype was tuned with: the same splash, every launch. */
const SEED = 99;

/**
 * Everything after the pen, worked out once: the drips, the pool they fill, the
 * letters falling in, and every drop of the eruption. A port of
 * the locked prototype that keeps its random sequence, so it plays out exactly
 * as it was tuned; positions across the screen scale with its width.
 */
export function buildWorld(
  settings: IntroSettings,
  stage: Stage,
  strokes: readonly StrokeTiming[],
  writeEnd: number,
  fallStart: number,
): World {
  const { height: H } = stage;
  const sx = stage.width / PROTOTYPE_WIDTH;
  const rnd = mulberry32(SEED);
  const r = (a: number, b: number) => a + (b - a) * rnd();
  const ws = Math.min(settings.writeWidth, stage.width - 40) / WORD.width;
  const cx = stage.width / 2;
  const cy = H / 2;
  const toX = (u: number) => cx + (u - WORD.width / 2) * ws;
  const yb = cy + (BOTTOM_EDGE - WORD.height / 2) * ws;
  const poolH = (settings.poolPct / 100) * H;
  const fallTime = (y: number, surface: number, g: number) =>
    Math.sqrt((2 * Math.max(10, surface - y)) / g);

  // Drips come from a few fixed spots on each letter's bottom edge, spaced so their drops
  // never overlap. Each spot drips one drop at a time, like a leaky tap, faster and faster,
  // from soon after the pen reaches it until the letters fall.
  const drips: Drip[] = [];
  const minGap = Math.max(1, (2.6 * 8 * settings.dripSize) / ws);
  BOTTOMS.forEach((spans, li) => {
    const sites: number[] = [];
    for (const [a0, a1] of spans) {
      const n = Math.max(1, Math.min(3, Math.floor((a1 - a0) / minGap) + 1));
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? r(a0, a1) : mix(a0, a1, (k + r(0.25, 0.75)) / n);
        if (sites.every((site) => Math.abs(site - u) >= minGap)) sites.push(u);
      }
    }
    const reached = strokes.find((stroke) => stroke.letter === li)?.start ?? 0;
    for (const site of sites) {
      let t = reached + r(200, 600);
      for (;;) {
        const hang = Math.max(40, settings.hangMs * r(0.75, 1.25));
        if (t + hang > fallStart) break;
        const rad = (r(3.2, 5) + 3 * clamp01(t / writeEnd)) * settings.dripSize;
        const td = t + hang;
        drips.push({ tb: t, td, th: 0, x: toX(site), r: rad, satellite: rnd() < 0.35, kick: [] });
        const perSecond = 1.1 * settings.drips * (0.3 + 3 * clamp01(t / writeEnd) ** 2);
        t = td + Math.max(30, (1000 / perSecond - hang) * r(0.6, 1.4));
      }
    }
  });

  // The pool is only what the drips have brought, sized so what has landed as the letters
  // let go stands at the pool height. Each lands on the surface as high as it is by then.
  drips.forEach((d) => {
    d.th = d.td + fallTime(yb + d.r * 3, H, GRAVITY.drip);
  });
  const byFall = drips.filter((d) => d.th <= fallStart).reduce((sum, d) => sum + d.r ** 3, 0) || 1;
  const perVolume = poolH / byFall;
  const landed: Drip[] = [];
  const level = (t: number) => {
    let volume = 0;
    for (const d of landed) if (t > d.th) volume += d.r ** 3 * easeOut(clamp01((t - d.th) / 220));
    return perVolume * volume;
  };
  const landing = (t0: number, y: number, g: number) => {
    const first = t0 + fallTime(y, H - level(t0 + 300), g);
    return t0 + fallTime(y, H - level(first), g);
  };
  drips.sort((p, q) => p.td - q.td);
  for (const d of drips) {
    d.th = landing(d.td, yb + d.r * 3, GRAVITY.drip);
    landed.push(d);
  }
  // Each drip knocks a few small drops up out of the pool as it lands, like a coin into water.
  for (const d of drips) {
    const n = rnd() < 0.45 ? 1 : rnd() < 0.6 ? 2 : 3;
    d.kick = Array.from({ length: n }, (_, i) => ({
      vx: i === 0 ? r(-0.03, 0.03) : r(-0.13, 0.13),
      h: (i === 0 ? r(14, 30) : r(6, 18)) * Math.sqrt(settings.dripSize),
      r: d.r * (i === 0 ? r(0.45, 0.6) : r(0.28, 0.42)),
      delay: r(25, 55),
    }));
  }

  // The letters drop in a random order, the middle ones a touch ahead: a barely-there U.
  // Each keeps falling as it pours in, and is all water once its top reaches the surface.
  const top = cy - (WORD.height / 2) * ws;
  const falls = LETTERS.map((_, i) => {
    const mid = 1 - ((i - 4.5) / 4.5) ** 2;
    const start = fallStart + r(0, 70) + 110 * (1 - mid);
    const [left, right] = LETTER_X[i] ?? [0, 0];
    const letterX = (left + right) / 2;
    const hit = landing(start, yb, GRAVITY.letter);
    const gone = start + Math.sqrt((2 * Math.max(10, H - level(hit) + 6 - top)) / GRAVITY.letter);
    return { start, hit, gone, rot: r(-8, 8), cx: letterX, x: toX(letterX) };
  });

  const impacts = drips
    .map((d) => ({ t: d.th, x: d.x, amp: 2 + d.r * 0.9, w: 60 }))
    .concat(falls.map((f) => ({ t: f.hit, x: f.x, amp: 18, w: 110 })));
  const heaves = falls.map((f) => ({ t: f.hit, x: f.x, A: 30, w: 30 }));
  const spray = falls.flatMap((f) =>
    Array.from({ length: 6 }, () => ({
      t0: f.hit,
      y0: H - level(f.hit),
      x: f.x + r(-18, 18),
      vx: r(-0.3, 0.3),
      vy: -r(0.4, 0.95),
      r: r(3, 6),
    })),
  );

  // The eruption: the thrown wall's unevenness, the drops it sheds, the crown's strands
  // and the central jet. Speeds are multiples of the wall's slowest part.
  const sheetPhase = Array.from({ length: 4 }, () => r(0, 6.28));
  const wordLeft = Math.min(...falls.map((f) => f.x));
  const wordRight = Math.max(...falls.map((f) => f.x));
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

  return {
    ws,
    cx,
    cy,
    yb,
    drips,
    perVolume,
    falls,
    impacts,
    heaves,
    spray,
    sheetPhase,
    splash: { edge, strands, jet },
  };
}
