import { stepBalloons } from "../logic/rise-balloons";
import { burstBalloon, stepDamage } from "../logic/rise-damage";
import { touchesBalloon } from "../logic/rise-drift";
import { MODE, STRING_POINTS, type RiseGame } from "../logic/rise-rules";
import { segmentLength } from "../logic/rise-setup";

/**
 * A page's living background: one balloon, adrift across the whole page as
 * the saved drift in the atmosphere — its answer on it, its string trailing,
 * glancing off the page's edges — or, for one that burst, drifting a moment
 * and bursting where it is, the game's paint landing behind the words. Built
 * from the game's own parts. Worklets, each after what it calls.
 */

/** The balloon's body, in points. */
const BALLOON_W = 104;
/** Where it starts, as shares of the page, and the way it's going (radians) and how fast (points/ms). */
const START = { x: 0.32, y: 0.64, heading: -0.7, speed: 0.03 };
/** A burst one bursts this long into its page: long enough to be seen drifting. */
const BURST_AFTER_MS = 1700;
/** Its saved size, so at the nearest depth it's drawn at `BALLOON_W`. */
const NEAREST = 1.12;
/**
 * In a finger's hold: the squash as it's taken; let go slower than `still`
 * (points/ms), it stops dead for `restMs`; flung, never faster than
 * `fastest`; and how much an off-centre throw sets it spinning.
 */
const HAND = { squash: 0.0005, still: 0.06, restMs: 2000, fastest: 2.4, spin: 0.00005 };

/** The page's one-balloon game — the answer on it, and its time beneath when it kept one — the page's edges its own. */
export function drifterGame(
  width: number,
  height: number,
  label: string,
  note: string | null,
): RiseGame {
  "worklet";
  const stage = {
    width,
    height,
    // Its floor exactly the page's foot, the hairline over the dots — debris rests there, the balloon
    // bounces off it, touching it — and its sides and top the page's own edges, full bleed.
    lineY: height + 0.5,
    edge: 0,
    balloonW: BALLOON_W,
    balloonH: BALLOON_W * 1.2,
    savedScale: 1 / NEAREST,
  };
  const x = width * START.x;
  const y = height * START.y;
  const knotY = y + stage.balloonH / 2 + 5;
  const sx = Array.from({ length: STRING_POINTS }, () => x);
  const sy = Array.from({ length: STRING_POINTS }, (_, i) => knotY + i * segmentLength(stage, 1));
  return {
    phase: "over",
    time: 0,
    stage,
    pairs: [
      { question: "", right: 0, marked: -1, markedAt: 0, start: 0, outcome: 0, practice: false },
    ],
    balloons: [
      {
        pair: 0,
        side: 0,
        mode: MODE.free,
        // Adrift from the start: never a balloon just saved, rising away.
        drifting: true,
        label,
        ...(note !== null && { note }),
        x,
        y,
        vx: Math.cos(START.heading) * START.speed,
        vy: Math.sin(START.heading) * START.speed,
        angle: 0,
        scale: 1,
        phase: 0.5,
        depth: 1,
        spin: 0,
        poke: 0,
        pokeV: 0,
        nudge: 0,
        nudgeV: 0,
        sx,
        sy,
        px: [...sx],
        py: [...sy],
        paint: [],
        flecks: [],
        tentative: -1,
        tentativeFlecks: -1,
      },
    ],
    drops: [],
    splats: [],
    drips: [],
    scraps: [],
    glass: [],
    gains: [],
    clearAt: -1,
    score: 0,
    stroke: { balloon: -1, lastX: 0, lastY: 0, length: 0, count: 0, startedAt: 0 },
    events: { marks: 0, touches: 0, pops: 0, bursts: 0, saves: 0 },
  };
}

/**
 * One step of the page's background, `ms` into it: the balloon adrift, and
 * — for one that burst — its burst when its time comes, its paint flying
 * and landing. Whether it burst this step is returned, for its knock.
 */
export function stepDrifter(game: RiseGame, rose: boolean, ms: number, dt: number): boolean {
  "worklet";
  game.time += dt;
  let burst = false;
  if (!rose && game.balloons[0]!.mode === MODE.free && ms >= BURST_AFTER_MS) {
    burstBalloon(game, 0);
    burst = true;
  }
  stepBalloons(game, dt);
  stepDamage(game, dt);
  return burst;
}

/** The background as it ends, at once, for a still page (Reduce Motion): a burst one already landed. */
export function settleDrifter(game: RiseGame, rose: boolean): void {
  "worklet";
  if (rose) return;
  burstBalloon(game, 0);
  for (let i = 0; i < 150; i += 1) {
    game.time += 1000 / 60;
    stepBalloons(game, 1000 / 60);
    stepDamage(game, 1000 / 60);
  }
}

/** Whether a touch at (x, y) lands on the balloon, while it's whole. */
export function touchesDrifter(game: RiseGame, x: number, y: number): boolean {
  "worklet";
  const b = game.balloons[0]!;
  return b.mode === MODE.free && touchesBalloon(b, game, x, y);
}

/** A finger takes hold of it where it touched: it stops, giving under the touch. */
export function holdDrifter(game: RiseGame, x: number, y: number): void {
  "worklet";
  const b = game.balloons[0]!;
  b.held = true;
  b.gripX = b.x - x;
  b.gripY = b.y - y;
  b.vx = 0;
  b.vy = 0;
  b.restUntil = 0;
  b.thrown = false;
  b.pokeV += HAND.squash;
}

/** The finger moves, at (vx, vy) points/ms: the balloon goes with it, its grip kept, never off the page. */
export function dragDrifter(game: RiseGame, x: number, y: number, vx: number, vy: number): void {
  "worklet";
  const b = game.balloons[0]!;
  if (!b.held) return;
  const halfW = (game.stage.balloonW / 2) * b.scale;
  const halfH = (game.stage.balloonH / 2) * b.scale;
  b.x = Math.max(halfW, Math.min(game.stage.width - halfW, x + (b.gripX ?? 0)));
  b.y = Math.max(halfH, Math.min(game.stage.height - halfH, y + (b.gripY ?? 0)));
  b.vx = vx;
  b.vy = vy;
}

/**
 * Let go, the finger going at (vx, vy) points/ms: barely moving, it stops
 * dead a beat (a tap does this); flung, it flies at the finger's speed —
 * capped — spinning by how far off its middle it was thrown. Whether it
 * stopped is returned, for its knock.
 */
export function releaseDrifter(game: RiseGame, vx: number, vy: number): boolean {
  "worklet";
  const b = game.balloons[0]!;
  if (!b.held) return false;
  b.held = false;
  const speed = Math.hypot(vx, vy);
  if (speed < HAND.still) {
    b.vx = 0;
    b.vy = 0;
    b.restUntil = game.time + HAND.restMs;
    return true;
  }
  const keep = Math.min(1, HAND.fastest / speed);
  b.vx = vx * keep;
  b.vy = vy * keep;
  b.thrown = true;
  // The finger's place from the middle, crossed with its throw: a flick off-centre spins it.
  const fromX = -(b.gripX ?? 0);
  const fromY = -(b.gripY ?? 0);
  b.spin += (fromX * b.vy - fromY * b.vx) * HAND.spin;
  return false;
}
