import {
  MODE,
  OUTCOME,
  RISE,
  STRING_POINTS,
  type Balloon,
  type RiseGame,
  type Stage,
} from "./rise-rules";

/** How much of the canvas's height is atmosphere, above the line. */
const ATMOSPHERE = 0.34;
/** A balloon's body, at most: this share of the width, or of the field's height, or this many points. */
const BALLOON = { ofWidth: 0.36, ofField: 0.36, most: 150, tall: 1.2 };
/** How small a saved balloon drifts to: farther away, so six fit the atmosphere. */
const SAVED_SCALE = 0.5;
/** A balloon's resting place across the field: a share of the width from the left, for each side. */
const LANE = [0.28, 0.72];
/** A string's length, as a share of its balloon's height, in its segments. */
const STRING_SHARE = 0.68;

/**
 * A number in [0, 1) from two: the same for the same two, everywhere — so a
 * day's bursts and drifts play out the same each time they're drawn.
 */
export function hash01(a: number, b: number): number {
  "worklet";
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Where everything goes on a canvas `width` by `height`. */
export function riseStage(width: number, height: number): Stage {
  "worklet";
  const lineY = Math.round(height * ATMOSPHERE);
  const balloonW = Math.min(
    width * BALLOON.ofWidth,
    (height - lineY) * BALLOON.ofField,
    BALLOON.most,
  );
  return {
    width,
    height,
    lineY,
    balloonW,
    balloonH: balloonW * BALLOON.tall,
    savedScale: SAVED_SCALE,
  };
}

/** A string's segment, for a balloon at `scale`. */
export function segmentLength(stage: Stage, scale: number): number {
  "worklet";
  return ((stage.balloonH * STRING_SHARE) / (STRING_POINTS - 1)) * scale;
}

/** A balloon's lane across the field: its side's, shifted a little for each pair. */
export function laneX(stage: Stage, pair: number, side: 0 | 1): number {
  "worklet";
  return stage.width * ((LANE.at(side) ?? 0.5) + (hash01(pair, side + 7) - 0.5) * 0.06);
}

/** One of a pair's two, waiting under the screen with its string hanging straight. */
function newBalloon(stage: Stage, pair: number, side: 0 | 1, label: string): Balloon {
  "worklet";
  const x = laneX(stage, pair, side);
  // Where its rise starts: its centre this share of its height under the screen (`START_BELOW`).
  const y = stage.height + stage.balloonH * 0.6;
  const knotY = y + stage.balloonH / 2;
  const sx: number[] = [];
  const sy: number[] = [];
  for (let i = 0; i < STRING_POINTS; i += 1) {
    sx.push(x);
    sy.push(knotY + i * segmentLength(stage, 1));
  }
  return {
    pair,
    side,
    mode: MODE.waiting,
    label,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    scale: 1,
    phase: hash01(pair * 2 + side, 3),
    depth: hash01(pair * 2 + side, 17),
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
  };
}

/** One question as the board plays it: its words, its two answers left first, and which is right. */
export type RisePairSpec = { question: string; answers: [string, string]; right: 0 | 1 };

/**
 * A new game on `stage`: its questions' pairs, each rising as the one before
 * reaches the line — after a practice pair, when there is one, whose mess is
 * swept away before the real ones begin. Ready, until it's started.
 */
export function newRiseGame(
  stage: Stage,
  questions: RisePairSpec[],
  practice: RisePairSpec | null = null,
): RiseGame {
  "worklet";
  const all = practice ? [practice, ...questions] : questions;
  const first = practice ? RISE.riseMs + RISE.practiceGapMs : 0;
  const pairs = all.map((spec, index) => ({
    question: spec.question,
    right: spec.right,
    marked: -1,
    markedAt: RISE.riseMs,
    start: practice && index === 0 ? 0 : first + (index - (practice ? 1 : 0)) * RISE.riseMs,
    outcome: OUTCOME.pending,
    practice: practice !== null && index === 0,
  }));
  const balloons = all.flatMap((spec, index) => [
    newBalloon(stage, index, 0, spec.answers[0]),
    newBalloon(stage, index, 1, spec.answers[1]),
  ]);
  return {
    phase: "ready",
    time: 0,
    stage,
    pairs,
    balloons,
    drops: [],
    splats: [],
    drips: [],
    scraps: [],
    glass: [],
    gains: [],
    clearAt: practice ? first : -1,
    score: 0,
    stroke: { balloon: -1, lastX: 0, lastY: 0, length: 0, count: 0, startedAt: 0 },
    events: { marks: 0, touches: 0, pops: 0, bursts: 0, saves: 0 },
  };
}
