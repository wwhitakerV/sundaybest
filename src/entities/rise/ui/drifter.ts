import { stepBalloons } from "../logic/rise-balloons";
import { burstBalloon, stepDamage } from "../logic/rise-damage";
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
    // Just under the page's foot: the foot is the floor — debris rests there, the balloon bounces off it.
    lineY: height + 1,
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
