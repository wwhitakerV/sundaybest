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
];

/** The side the preview crosses out on each: the wrong one twice, and once the right one — a burst. */
export const RISE_DEMO_MARKS = [0, 0, 1];
