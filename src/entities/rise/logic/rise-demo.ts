import type { RisePairSpec } from "./rise-setup";

/** The practice pair, the first time anyone plays: plain enough to learn the twist on. */
export const RISE_PRACTICE: RisePairSpec = {
  question: "Which is a fruit?",
  answers: ["Apple", "Brick"],
  right: 0,
};

/** Home's preview plays these — never a real day's, so it gives nothing away. */
export const RISE_DEMO: RisePairSpec[] = [
  { question: "Which can fly?", answers: ["Turtle", "Eagle"], right: 1 },
  { question: "Which is bigger?", answers: ["Sun", "Moon"], right: 0 },
  { question: "Which is frozen water?", answers: ["Ice", "Steam"], right: 0 },
  { question: "Which has more legs?", answers: ["Ant", "Spider"], right: 1 },
  { question: "Which is a mammal?", answers: ["Whale", "Shark"], right: 0 },
  { question: "Which melts in the sun?", answers: ["Stone", "Snow"], right: 1 },
];

/**
 * The side the preview crosses out on each: the wrong one three times (Turtle,
 * Steam, Shark) and the right one three times — a burst (Sun, Spider, Snow).
 */
export const RISE_DEMO_MARKS = [0, 0, 1, 1, 1, 1];

/** A loop of points round a middle, a little past one turn, as a hand closes a circle: [x, y, …]. */
function loopAround(cx: number, cy: number, rx: number, ry: number, points: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= points; i += 1) {
    const angle = -Math.PI / 2 + (i / points) * Math.PI * 2 * 1.08;
    out.push(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry);
  }
  return out;
}

/**
 * A frantic scribble over the whole balloon: back and forth, top to bottom,
 * each row as wide as the balloon is there, inside its edge: [x, y, …].
 */
function scribbleOver(rows: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < rows; i += 1) {
    const y = -0.72 + (i / (rows - 1)) * 1.32;
    const reach = 0.76 * Math.sqrt(Math.max(0, 1 - y * y));
    const side = i % 2 === 0 ? -1 : 1;
    out.push(side * reach, y, -side * reach, y + 0.07);
  }
  return out;
}

/**
 * How the preview crosses each out, a different mark in a different place on
 * each, as different people would: each a list of strokes, the pen lifted
 * between them, each stroke its points as shares of the balloon's half-width
 * (x) and half-height (y) from its middle — a two-stroke X high on the left,
 * two long diagonals right across it, a circle right of its middle, one slash
 * corner to corner, a frantic scribble over the whole balloon, and a small X
 * low on its right.
 */
export const RISE_DEMO_STROKES: readonly (readonly number[])[][] = [
  [
    [-0.6, -0.6, 0.05, 0.02],
    [0.05, -0.6, -0.6, 0.02],
  ],
  [
    [-0.78, -0.32, 0.6, 0.58],
    [-0.55, -0.7, 0.82, 0.22],
  ],
  [loopAround(0.2, -0.12, 0.34, 0.3, 16)],
  [[-0.55, 0.45, 0.6, -0.5]],
  [scribbleOver(9)],
  [
    [0, 0.05, 0.62, 0.6],
    [0.62, 0.05, 0, 0.6],
  ],
];
