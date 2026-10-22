/**
 * RISE's world, in screen points: the atmosphere at the top, a thin line
 * under it, and the field below, where each question's two balloons rise
 * from under the screen's foot to the line in `RISE.riseMs` — the rise is
 * the clock. The game is stepped on the UI thread (`advanceRise`), its parts
 * in `rise-balloons`, `rise-paint`, `rise-damage` and `rise-step`.
 *
 * A worklet calls only worklets defined above it in its file (or imported):
 * one calling another defined further down finds nothing on the UI thread,
 * and an error there aborts the app.
 */

/** The game's timing, and how much paint marks a balloon. */
export const RISE = {
  /** A pair's rise from under the screen to the line. */
  riseMs: 5000,
  /** After the practice pair resolves: a beat to see it, before the screen clears. */
  practiceGapMs: 1800,
  /** After the last pair resolves, before it's over. */
  endMs: 2200,
  /** How far a stroke must paint across a balloon to mark it, in points: a tap never does. */
  markLength: 24,
  /** How long a saved pair's "+2.9s" shows, rising off it as it fades. */
  gainMs: 1400,
  /** The grain time is kept in: a tenth of a second, as it's shown. */
  tenthMs: 100,
};

/** A balloon's state: waiting to rise, rising, surviving into the atmosphere, saved, popped, cleared. */
export const MODE = { waiting: 0, rising: 1, crossing: 2, free: 3, popped: 4, gone: 5 } as const;
/** How a pair ended: not yet, the wrong one crossed out, the right one crossed out, nothing marked. */
export const OUTCOME = { pending: 0, right: 1, wrong: 2, missed: 3 } as const;
/** How many points a balloon's string has. */
export const STRING_POINTS = 8;

/** Where things are, for a canvas this size. */
export type Stage = {
  width: number;
  height: number;
  /** The atmosphere's line. */
  lineY: number;
  /** A rising balloon's body, before it's saved and drifts smaller into the distance. */
  balloonW: number;
  balloonH: number;
  savedScale: number;
};

export type Balloon = {
  pair: number;
  side: 0 | 1;
  mode: number;
  label: string;
  /** A line under its answer, smaller: the time it kept ("+1.5s"), on a page of what was learned. */
  note?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  scale: number;
  /** Its own drift and rock, fixed when it's made. */
  phase: number;
  /** How near it floats once saved: 0 the farthest, 1 the nearest. */
  depth: number;
  /** How fast it's turning, once saved (radians/ms). */
  spin: number;
  /** Squash and sideways push from a touch: springs, at rest at 0. */
  poke: number;
  pokeV: number;
  nudge: number;
  nudgeV: number;
  /** Its string's points now and a step ago (Verlet), the first at the knot. */
  sx: number[];
  sy: number[];
  px: number[];
  py: number[];
  /** Its paint, in its own unrotated, unscaled points: [x, y, width, startsStroke], flat. */
  paint: number[];
  /** Flecks of paint on it: [x, y, radius], flat. */
  flecks: number[];
  /** Where in `paint` and `flecks` the stroke not yet marking it begins — or -1. */
  tentative: number;
  tentativeFlecks: number;
};

type Pair = {
  question: string;
  /** Which side is right: 0, the left. */
  right: 0 | 1;
  /** Which side is marked — crossed out as wrong — or -1. */
  marked: number;
  /** How long into its rise it was last marked, in ms. */
  markedAt: number;
  start: number;
  outcome: number;
  practice: boolean;
};

/** Debris: a scrap of torn latex. `rest`: 0 flying, 1 caught on the line, 2 on the floor, 3 gone. */
type Scrap = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  seed: number;
  rest: number;
  /** From a clean pop: it falls away and leaves nothing. */
  clean: boolean;
};

/** A drop of black paint in the air, until it lands. */
type Drop = { x: number; y: number; vx: number; vy: number; r: number; landAt: number };

export type RiseGame = {
  phase: "ready" | "play" | "over";
  time: number;
  stage: Stage;
  pairs: Pair[];
  balloons: Balloon[];
  drops: Drop[];
  /** Landed paint: [x, y, radius, stretchX, stretchY], flat — it stays where it lands. */
  splats: number[];
  /** Paint running down: [x, top, length, fullLength, width], flat. */
  drips: number[];
  scraps: Scrap[];
  /** Flecks of white thrown past a balloon onto the glass: [x, y, radius, balloon], flat. */
  glass: number[];
  /** Time kept, shown as it's won: [balloon, unused, bornAt, ms], flat — rising off its balloon, fading. */
  gains: number[];
  /** When the practice pair's mess is swept away: -1, never. */
  clearAt: number;
  score: number;
  /** The stroke under the finger now. */
  /** The stroke under the finger now — and when it landed on its balloon, which is when a mark it makes was made. */
  stroke: {
    balloon: number;
    lastX: number;
    lastY: number;
    length: number;
    count: number;
    startedAt: number;
  };
  /** Counted as they happen, for the screen's haptics. */
  events: { marks: number; touches: number; pops: number; bursts: number; saves: number };
};
