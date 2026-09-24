/**
 * Each card's turn on stage, as pure functions of how long it has been
 * playing (ms from the start of the card's beat).
 *
 * A turn: the card takes the stage, then one or more pieces of its UI lift
 * off the phone in turn — each jumps into the foreground, plays its little
 * scene there, and snaps back onto the phone — before the next card goes.
 *
 * A piece's scene is written as if its lift were the turn's only one, timed
 * from the turn's start (`LIFTED_AT_MS` onward); `getLiftElapsedMs` shifts a
 * later lift's clock to match. Before its lift a piece is at 0ms; once the
 * card's turn is over it is at `Infinity`.
 */

// ---------------------------------------------------------------------------
// The lift: the same off-and-back-on for every piece
// ---------------------------------------------------------------------------

/**
 * The phone navigating between screens, as iOS does: a push slides in from
 * the right, a full-screen modal slides up. (Stepping within a screen is the
 * app's own `useStepTransition`, ~260ms.)
 */
export const NAVIGATION_MS = { push: 450, modal: 500 } as const;

export const LIFT = {
  /** Waits for the phone to finish navigating to the screen (`NAVIGATION_MS`) and settle. */
  startMs: 600,
  /** Jumping off the phone into the foreground. */
  outMs: 420,
  /** Snapping back down onto the phone. */
  backMs: 380,
  /** Slack after the snap-back, so the hand-off happens once it has landed. */
  handoffMs: 60,
  /** Between one piece landing back and the next lifting, on a turn with several. */
  gapMs: 200,
  /** A beat of stillness before the next card takes the stage. */
  tailMs: 150,
} as const;

/** When a (first) piece is up and its scene can start. */
export const LIFTED_AT_MS = LIFT.startMs + LIFT.outMs;

export type LiftState = {
  /** The foreground copy exists (and the phone's own copy is hidden). */
  overlay: boolean;
  /** It's up in the foreground — false while it travels back down. */
  lifted: boolean;
};

/** Where a lift is, on its own clock, for a piece whose scene plays for `sceneMs`. */
export function getLiftState(elapsedMs: number, sceneMs: number): LiftState {
  const returnAtMs = LIFTED_AT_MS + sceneMs;
  const landedAtMs = returnAtMs + LIFT.backMs + LIFT.handoffMs;
  const started = elapsedMs >= LIFT.startMs;
  return {
    overlay: started && elapsedMs < landedAtMs,
    lifted: started && elapsedMs < returnAtMs,
  };
}

/**
 * One lift of a turn: how long its scene plays once the piece is up; how long
 * to wait before it lifts (`leadMs` — for the screen to scroll the piece into
 * view first, on a turn whose pieces aren't all on screen); and any extra
 * stillness after it lands back (`afterMs`) before the story moves on.
 *
 * `waitMs` holds still before the lead-in, for the screen to finish arriving.
 */
export type LiftSpec = { sceneMs: number; waitMs?: number; leadMs?: number; afterMs?: number };

/** Scrolling a piece into view before it lifts: the scroll, then a beat to settle. */
export const SCROLL = { durationMs: 700, leadMs: 850 } as const;

/** How long one lift takes, from leaving the phone to the hand-off back. */
function getLiftSpanMs(sceneMs: number): number {
  return LIFT.outMs + sceneMs + LIFT.backMs + LIFT.handoffMs;
}

/** When each of a turn's lifts starts, from the turn's start (after its wait and lead-in). */
function getLiftStartsMs(lifts: readonly LiftSpec[]): number[] {
  let cursorMs = LIFT.startMs;
  return lifts.map(({ sceneMs, waitMs = 0, leadMs = 0, afterMs = 0 }) => {
    const startMs = cursorMs + waitMs + leadMs;
    cursorMs = startMs + getLiftSpanMs(sceneMs) + afterMs + LIFT.gapMs;
    return startMs;
  });
}

/**
 * The clock lift `index` of a turn plays on: shifted so that lift starts at
 * `LIFT.startMs`, the same as a turn's first. A piece's scene is written
 * against that, whichever lift of the turn it is.
 */
export function getLiftElapsedMs(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
  index: number,
): number {
  const startMs = getLiftStartsMs(lifts).at(index) ?? LIFT.startMs;
  return Math.max(0, turnElapsedMs - startMs + LIFT.startMs);
}

/** The lift under way in a turn, if any: which one, and where it is on its own clock. */
export type ActiveLift = { index: number; elapsedMs: number; state: LiftState };

export function getActiveLift(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
): ActiveLift | null {
  for (const [index, { sceneMs }] of lifts.entries()) {
    const elapsedMs = getLiftElapsedMs(turnElapsedMs, lifts, index);
    const state = getLiftState(elapsedMs, sceneMs);
    if (state.overlay) return { index, elapsedMs, state };
  }
  return null;
}

/**
 * Which lift's piece the screen should be scrolled to: the latest lift whose
 * lead-in has begun, among those that have one. Null before any — the screen
 * sits at the top.
 */
export function getScrollTargetIndex(
  turnElapsedMs: number,
  lifts: readonly LiftSpec[],
): number | null {
  const starts = getLiftStartsMs(lifts);
  let target: number | null = null;
  for (const [index, { leadMs = 0 }] of lifts.entries()) {
    const leadStartMs = (starts.at(index) ?? 0) - leadMs;
    if (leadMs > 0 && turnElapsedMs >= leadStartMs) target = index;
  }
  return target;
}

/** How long a card's whole turn takes, all its lifts (and lead-ins) included. */
export function getTurnMs(lifts: readonly LiftSpec[]): number {
  const starts = getLiftStartsMs(lifts);
  const lastStart = starts.at(-1) ?? LIFT.startMs;
  const last = lifts.at(-1);
  return lastStart + getLiftSpanMs(last?.sceneMs ?? 0) + (last?.afterMs ?? 0) + LIFT.tailMs;
}

function countFrom(elapsedMs: number, fromMs: number, stepMs: number, max: number): number {
  return Math.min(max, Math.max(0, Math.floor((elapsedMs - fromMs) / stepMs)));
}

// ---------------------------------------------------------------------------
// Paste: the Paste button is tapped and the link types in
// ---------------------------------------------------------------------------

export const PASTE_LINK = "youtube.com/watch?v=Qm81xRz4";

export const PASTE_SCENE = {
  sceneMs: 1500,
  tapAtMs: LIFTED_AT_MS + 250,
  typeFromMs: LIFTED_AT_MS + 420,
  charMs: 28,
} as const;

export type PasteScene = { tapped: boolean; typedChars: number; complete: boolean };

export function getPasteScene(elapsedMs: number): PasteScene {
  const typedChars = countFrom(
    elapsedMs,
    PASTE_SCENE.typeFromMs,
    PASTE_SCENE.charMs,
    PASTE_LINK.length,
  );
  return {
    tapped: elapsedMs >= PASTE_SCENE.tapAtMs,
    typedChars,
    complete: typedChars === PASTE_LINK.length,
  };
}

// ---------------------------------------------------------------------------
// Plan: a day is picked, then "Create my plan" is pressed
// ---------------------------------------------------------------------------

export const PLAN_SCENE = {
  sceneMs: 1500,
  pick: { atMs: LIFTED_AT_MS + 300, day: 6 },
  pressAtMs: LIFTED_AT_MS + 950,
} as const;

export function getPlanScene(elapsedMs: number): { selectedDay: number | null } {
  return { selectedDay: elapsedMs >= PLAN_SCENE.pick.atMs ? PLAN_SCENE.pick.day : null };
}

export function getCreateScene(elapsedMs: number): { pressed: boolean } {
  return { pressed: elapsedMs >= PLAN_SCENE.pressAtMs };
}

// ---------------------------------------------------------------------------
// Read: "Hear this part of the sermon" is played
// ---------------------------------------------------------------------------

export const LISTEN_SCENE = {
  sceneMs: 1500,
  pressAtMs: LIFTED_AT_MS + 350,
  /** Where in the sermon this part starts, in seconds (18:42). */
  startsAtS: 18 * 60 + 42,
} as const;

/** How many whole seconds play before the scene ends. */
const LISTEN_MAX_S = Math.floor(
  (LIFTED_AT_MS + LISTEN_SCENE.sceneMs - LISTEN_SCENE.pressAtMs) / 1000,
);

export type ListenScene = { playing: boolean; clock: string };

/** Whether play has been pressed, and the sermon's clock ("18:42", ticking once it plays). */
export function getListenScene(elapsedMs: number): ListenScene {
  const playing = elapsedMs >= LISTEN_SCENE.pressAtMs;
  const playedS = playing
    ? Math.min(LISTEN_MAX_S, Math.floor((elapsedMs - LISTEN_SCENE.pressAtMs) / 1000))
    : 0;
  const atS = LISTEN_SCENE.startsAtS + playedS;
  const seconds = String(atS % 60).padStart(2, "0");
  return { playing, clock: `${Math.floor(atS / 60)}:${seconds}` };
}

// ---------------------------------------------------------------------------
// Scripture: the verse's words light up as if read along
// ---------------------------------------------------------------------------

const SCRIPTURE_VERSE = "For it is by grace you have been saved through faith.";
export const SCRIPTURE_WORDS: readonly string[] = SCRIPTURE_VERSE.split(" ");

export const SCRIPTURE_SCENE = { sceneMs: 1500, fromMs: LIFTED_AT_MS + 150, wordMs: 100 } as const;

/** How many of `SCRIPTURE_WORDS` are lit, from the first. */
export function getScriptureScene(elapsedMs: number): { litWords: number } {
  return {
    litWords: countFrom(
      elapsedMs,
      SCRIPTURE_SCENE.fromMs - SCRIPTURE_SCENE.wordMs,
      SCRIPTURE_SCENE.wordMs,
      SCRIPTURE_WORDS.length,
    ),
  };
}

// ---------------------------------------------------------------------------
// Reflect: an answer is written out
// ---------------------------------------------------------------------------

export const REFLECT_ANSWER =
  "Honestly, my mornings. If I skip time with God I feel like I owe Him extra the next day";

export const REFLECT_SCENE = { sceneMs: 1400, typeFromMs: LIFTED_AT_MS + 150, charMs: 12 } as const;

export function getReflectScene(elapsedMs: number): { typedChars: number } {
  return {
    typedChars: countFrom(
      elapsedMs,
      REFLECT_SCENE.typeFromMs,
      REFLECT_SCENE.charMs,
      REFLECT_ANSWER.length,
    ),
  };
}

// ---------------------------------------------------------------------------
// Pray: the prayer fills from grey to black, like a karaoke highlight
// ---------------------------------------------------------------------------

export const PRAYER_LINES: readonly string[] = [
  "Father, I've been trying to pay",
  "for what You already gave.",
  "Help me stop keeping score.",
  "Today I choose You. Amen.",
];

const PRAYER_LENGTH = PRAYER_LINES.reduce((total, line) => total + line.length, 0);

export const PRAY_SCENE = { sceneMs: 1700, fromMs: LIFTED_AT_MS + 150, charMs: 12 } as const;

/** How many of the prayer's characters are filled in, reading through its lines in order. */
export function getPrayScene(elapsedMs: number): { filledChars: number } {
  return {
    filledChars: countFrom(elapsedMs, PRAY_SCENE.fromMs, PRAY_SCENE.charMs, PRAYER_LENGTH),
  };
}

/** How much of each line is filled, given how far the fill has read overall. */
export function getFilledPerLine(filledChars: number): number[] {
  let remaining = filledChars;
  return PRAYER_LINES.map((line) => {
    const filled = Math.min(line.length, Math.max(0, remaining));
    remaining -= line.length;
    return filled;
  });
}

// ---------------------------------------------------------------------------
// Quiz: B is picked, then shown right while the others dim
// ---------------------------------------------------------------------------

export const QUIZ_SCENE = {
  sceneMs: 1300,
  pickAtMs: LIFTED_AT_MS + 350,
  revealAtMs: LIFTED_AT_MS + 850,
} as const;

export type QuizScene = { picked: boolean; revealed: boolean };

export function getQuizScene(elapsedMs: number): QuizScene {
  return {
    picked: elapsedMs >= QUIZ_SCENE.pickAtMs,
    revealed: elapsedMs >= QUIZ_SCENE.revealAtMs,
  };
}
