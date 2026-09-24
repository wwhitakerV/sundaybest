import {
  SCROLL,
  LISTEN_SCENE,
  PASTE_SCENE,
  PLAN_SCENE,
  PRAY_SCENE,
  QUIZ_SCENE,
  SCRIPTURE_SCENE,
  REFLECT_SCENE,
  getTurnMs,
  type LiftSpec,
} from "./scenes";

/**
 * The Welcome screen's intro story, as data. One big phone sits still in the
 * middle of the stage and navigates itself through the app's screens; pieces
 * of each screen lift off it and play; the how-it-works step shows below.
 * Everything renders from the current `StoryPhase`; nothing here knows about
 * React or animation, only what should be showing.
 */

/**
 * The app's screens the phone navigates between — each a mock of the real
 * one, stepping the same way: New Plan (paste, then link preview), the Daily
 * Study session (read, scripture, reflect, pray), and a Quick Check question.
 */
export type StoryScreen = "newPlan" | "study" | "quiz";

/**
 * The story's turns, in order: which screen and which of its steps each one
 * shows (`screenStep`); the how-it-works step it illustrates (`step`, with
 * `word` picking out which comma-separated item of step 3, "Read, reflect,
 * pray, and quiz", it stands for); and how long each of its lifts' scenes
 * plays.
 */
export const STORY_CARDS = [
  {
    key: "paste",
    screen: "newPlan",
    screenStep: 0,
    step: 0,
    word: null,
    // A beat after the link field lands back, before New Plan steps on.
    lifts: [{ sceneMs: PASTE_SCENE.sceneMs, afterMs: 700 }],
  },
  {
    key: "plan",
    screen: "newPlan",
    screenStep: 1,
    step: 1,
    word: null,
    // Waits for the sermon card to rise in, scrolls down to the days and
    // "Create my plan", holds them on screen a moment, then lifts them
    // together — and holds still once they're back on the phone, so the
    // hand-off has fully landed before the study session slides up over it.
    lifts: [
      { sceneMs: PLAN_SCENE.sceneMs, waitMs: 500, leadMs: SCROLL.leadMs + 300, afterMs: 450 },
    ],
  },
  {
    key: "read",
    screen: "study",
    screenStep: 0,
    step: 2,
    word: 0,
    // The session slides up on the Read page's top; a moment to take it in,
    // then it scrolls down to "Hear this part of the sermon" before it lifts.
    lifts: [{ sceneMs: LISTEN_SCENE.sceneMs, waitMs: 300, leadMs: SCROLL.leadMs }],
  },
  {
    // Reading on: the Scripture step still stands for "Read".
    key: "scripture",
    screen: "study",
    screenStep: 1,
    step: 2,
    word: 0,
    lifts: [{ sceneMs: SCRIPTURE_SCENE.sceneMs }],
  },
  {
    key: "reflect",
    screen: "study",
    screenStep: 2,
    step: 2,
    word: 1,
    lifts: [{ sceneMs: REFLECT_SCENE.sceneMs }],
  },
  {
    key: "pray",
    screen: "study",
    screenStep: 3,
    step: 2,
    word: 2,
    lifts: [{ sceneMs: PRAY_SCENE.sceneMs }],
  },
  {
    key: "quiz",
    screen: "quiz",
    screenStep: 0,
    step: 2,
    word: 3,
    lifts: [{ sceneMs: QUIZ_SCENE.sceneMs }],
  },
] as const;

export type StoryCardKey = (typeof STORY_CARDS)[number]["key"];

const FIRST_CARD = 0;
const LAST_CARD = STORY_CARDS.length - 1;

/**
 * - `arrive` — the phone slides up into the stage on its first screen, then
 *   the hand behind it fans out; nothing has started playing.
 * - `focus` — a screen's turn: the phone navigates to it, then its pieces lift.
 * - `leave` — the last turn is over; the hand folds in behind the phone,
 *   then the phone drops out of the stage.
 */
export type StoryPhase =
  { kind: "arrive" } | { kind: "focus"; card: StoryCardKey } | { kind: "leave" };

/** A phase and how long to hold it before the next. */
export type StoryBeat = { phase: StoryPhase; holdMs: number };

// ---------------------------------------------------------------------------
// The hand behind the phone
// ---------------------------------------------------------------------------

/**
 * The small, dimmed phones fanned behind the big one — decoration, showing
 * other moments of the flow, finished. Equal on each side, listed left to
 * right. `angleDeg` tilts each about a pivot below it, like a hand of cards.
 */
export const SIDE_CARDS: readonly { screen: StoryScreen; step: number; angleDeg: number }[] = [
  { screen: "newPlan", step: 0, angleDeg: -26 },
  { screen: "newPlan", step: 1, angleDeg: -18 },
  { screen: "study", step: 2, angleDeg: 18 },
  { screen: "quiz", step: 0, angleDeg: 26 },
];

/**
 * The hand opening and closing. It starts folded — every card upright,
 * hidden behind the big phone — and once the phone is up it fans out one
 * card at a time, left to right. When the last turn is over both sides fold
 * back in to the middle together, mirrored, before the stage goes.
 */
export const FAN = {
  /** Into the stage's arrival: the phone has all but settled from its slide up. */
  outFromMs: 850,
  /** Overlapping, so the hand opens as one smooth sweep rather than four moves. */
  outStaggerMs: 150,
  /** Each card's spring out (perceptual: iOS-style, it settles over ~1.5×). */
  outMs: 900,
  /** Every card's fold back in: one smooth, eased swing, all at once. */
  inMs: 500,
} as const;

/**
 * How long side card `index` waits before it moves: fanning out as the stage
 * arrives (`fanned`, while `isStageShown`), or folding in as it leaves.
 */
export function getFanDelayMs(index: number, fanned: boolean): number {
  return fanned ? FAN.outFromMs + index * FAN.outStaggerMs : 0;
}

/**
 * The phone, with the hand behind it, sliding the whole height of the stage:
 *
 * - arriving, up from below the stage's bottom on a spring (`inMs`,
 *   perceptual) that gathers speed and settles with a soft give;
 * - leaving, the moment the hand has folded out of sight (`outDelayMs`), a
 *   quick springy hop up; `hopMs` into it, it rushes down out of the
 *   bottom, gathering speed (`dropMs`), as the caption fades.
 */
export const STAGE_SLIDE = {
  inMs: 1000,
  outDelayMs: FAN.inMs,
  hopMs: 100,
  dropMs: 340,
} as const;
/** After the last card starts fanning out, a breath before the first turn begins. */
const ARRIVE_PAUSE_MS = 500;
/** After it has dropped out, a pause before it comes back. */
const LEAVE_PAUSE_MS = 400;

/**
 * One loop of the story: the stage arrives on the first screen, the phone
 * takes each screen's turn, and the stage leaves — then it all begins again.
 */
export const STORY_BEATS: readonly StoryBeat[] = [
  {
    phase: { kind: "arrive" },
    holdMs: getFanDelayMs(SIDE_CARDS.length - 1, true) + ARRIVE_PAUSE_MS,
  },
  ...STORY_CARDS.map((card) => ({
    phase: { kind: "focus", card: card.key } as const,
    holdMs: getTurnMs(card.lifts),
  })),
  {
    phase: { kind: "leave" },
    holdMs: STAGE_SLIDE.outDelayMs + STAGE_SLIDE.hopMs + STAGE_SLIDE.dropMs + LEAVE_PAUSE_MS,
  },
];

/** One whole loop of the story, arriving to gone. */
export const STORY_LOOP_MS = STORY_BEATS.reduce((total, beat) => total + beat.holdMs, 0);

/** Whether the stage is showing (its phone drops out while leaving). */
export function isStageShown(phase: StoryPhase): boolean {
  return phase.kind !== "leave";
}

/** Card `key`'s lifts, in order. */
export function getLiftsFor(key: StoryCardKey): readonly LiftSpec[] {
  return STORY_CARDS.find((card) => card.key === key)?.lifts ?? [];
}

function getScreenIndex(phase: StoryPhase): number {
  switch (phase.kind) {
    case "arrive":
      return FIRST_CARD;
    case "leave":
      return LAST_CARD;
    case "focus":
      return STORY_CARDS.findIndex((card) => card.key === phase.card);
  }
}

/** The screen the phone is showing in `phase`. */
export function getScreen(phase: StoryPhase): StoryScreen {
  return (STORY_CARDS.at(getScreenIndex(phase)) ?? STORY_CARDS[0]).screen;
}

/**
 * How the phone gets to `phase`'s screen, as the real app does:
 *
 * - `step` — the same screen, next step: it steps itself (its body
 *   cross-fades under a header that stays; see `useStepTransition`).
 * - `modal` — the Daily Study session presents as a full-screen modal,
 *   sliding up.
 * - `push` — Quick Check pushes, sliding in from the right.
 * - `cut` — arriving: the stage is invisible (on mount, or faded out at the
 *   end of a loop), so the phone simply starts on its first screen.
 */
export type StoryNavigation = "cut" | "step" | "modal" | "push";

export function getNavigation(phase: StoryPhase): StoryNavigation {
  if (phase.kind !== "focus") return "cut";
  const index = getScreenIndex(phase);
  const card = STORY_CARDS.at(index);
  const previous = STORY_CARDS.at(index - 1);
  if (!card || !previous || index === FIRST_CARD) return "cut";
  if (card.screen === previous.screen) return "step";
  return card.screen === "quiz" ? "push" : "modal";
}

/** What a screen shows: which of its steps, and how far into that step's turn. */
export type ScreenView = { step: number; elapsedMs: number };

/**
 * What `screen` shows in `phase`. The screen on the phone shows its current
 * step — at its start while the stage arrives, on the turn's clock during a
 * turn, finished while the stage leaves. A screen that's been navigated away
 * from shows its last step, finished.
 */
export function getScreenView(
  screen: StoryScreen,
  phase: StoryPhase,
  turnElapsedMs: number,
): ScreenView {
  const current = STORY_CARDS.at(getScreenIndex(phase));
  if (current?.screen === screen) {
    const elapsedMs =
      phase.kind === "arrive" ? 0 : phase.kind === "leave" ? Infinity : turnElapsedMs;
    return { step: current.screenStep, elapsedMs };
  }
  const lastStep = STORY_CARDS.filter((card) => card.screen === screen).at(-1)?.screenStep ?? 0;
  return { step: lastStep, elapsedMs: Infinity };
}

/**
 * The step line under the lifted UI: nothing before the first turn, or the
 * step on screen — with `word` picking out one item of step 3. While the
 * stage leaves, the last step stays up and fades out as the phone drops.
 */
export type CaptionState = { mode: "hidden" } | { mode: "step"; step: number; word: number | null };

export function getCaption(phase: StoryPhase): CaptionState {
  if (phase.kind === "arrive") return { mode: "hidden" };
  const card = STORY_CARDS.at(getScreenIndex(phase));
  return card ? { mode: "step", step: card.step, word: card.word } : { mode: "hidden" };
}
