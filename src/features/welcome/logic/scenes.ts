/**
 * Each card's turn on stage, as pure functions of how long it has been
 * playing (ms from the start of the card's beat).
 *
 * A turn has the same shape for every card: the card takes the stage, its
 * key piece of UI lifts off the phone into the foreground, plays its little
 * scene there, then snaps back onto the phone before the next card goes.
 * A card that hasn't had its turn is at 0ms; a finished one is at `Infinity`.
 */

// ---------------------------------------------------------------------------
// The lift: the same off-and-back-on for every card
// ---------------------------------------------------------------------------

export const LIFT = {
  /** Waits for the card to (all but) settle on stage before lifting. */
  startMs: 500,
  /** Jumping off the phone into the foreground. */
  outMs: 420,
  /** Snapping back down onto the phone. */
  backMs: 380,
  /** Slack after the snap-back, so the hand-off happens once it has landed. */
  handoffMs: 60,
  /** A beat of stillness before the next card takes the stage. */
  tailMs: 150,
} as const;

/** When the piece is up and its scene can start. */
export const LIFTED_AT_MS = LIFT.startMs + LIFT.outMs;

export type LiftState = {
  /** The foreground copy exists (and the phone's own copy is hidden). */
  overlay: boolean;
  /** It's up in the foreground — false while it travels back down. */
  lifted: boolean;
};

/** Where the lift is for a card whose scene plays for `sceneMs` once lifted. */
export function getLiftState(elapsedMs: number, sceneMs: number): LiftState {
  const returnAtMs = LIFTED_AT_MS + sceneMs;
  const landedAtMs = returnAtMs + LIFT.backMs + LIFT.handoffMs;
  const started = elapsedMs >= LIFT.startMs;
  return {
    overlay: started && elapsedMs < landedAtMs,
    lifted: started && elapsedMs < returnAtMs,
  };
}

/** How long a card's whole turn takes, lift included. */
export function getTurnMs(sceneMs: number): number {
  return LIFTED_AT_MS + sceneMs + LIFT.backMs + LIFT.handoffMs + LIFT.tailMs;
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
// Plan: pick 3 days, then change to 6
// ---------------------------------------------------------------------------

export const PLAN_SCENE = {
  sceneMs: 1300,
  picks: [
    { atMs: LIFTED_AT_MS + 300, day: 3 },
    { atMs: LIFTED_AT_MS + 850, day: 6 },
  ],
} as const;

export function getPlanScene(elapsedMs: number): { selectedDay: number | null } {
  const lastPick = PLAN_SCENE.picks.filter((pick) => elapsedMs >= pick.atMs).at(-1);
  return { selectedDay: lastPick?.day ?? null };
}

/** A plan starts on Monday; this says when one `days` long ends. */
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getPlanEndsLine(days: number | null): string {
  if (days === null) return "Pick how long your plan runs.";
  const endDay = WEEKDAYS.at(days - 1) ?? "Sunday";
  return days === 6 ? `Ends ${endDay}, right before next Sunday.` : `Ends ${endDay}.`;
}

// ---------------------------------------------------------------------------
// Preview: the sermon the plan is built from, tapped into
// ---------------------------------------------------------------------------

export const PREVIEW_SCENE = { sceneMs: 1100, tapAtMs: LIFTED_AT_MS + 400 } as const;

export function getPreviewScene(elapsedMs: number): { tapped: boolean } {
  return { tapped: elapsedMs >= PREVIEW_SCENE.tapAtMs };
}

// ---------------------------------------------------------------------------
// Read: the verse's words light up as if read along
// ---------------------------------------------------------------------------

const READ_VERSE = "For it is by grace you have been saved through faith.";
export const READ_WORDS: readonly string[] = READ_VERSE.split(" ");

export const READ_SCENE = { sceneMs: 1500, fromMs: LIFTED_AT_MS + 150, wordMs: 100 } as const;

/** How many of `READ_WORDS` are lit, from the first. */
export function getReadScene(elapsedMs: number): { litWords: number } {
  return {
    litWords: countFrom(
      elapsedMs,
      READ_SCENE.fromMs - READ_SCENE.wordMs,
      READ_SCENE.wordMs,
      READ_WORDS.length,
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
// Pray: the prayer's lines come in one by one, in a warm glow
// ---------------------------------------------------------------------------

export const PRAYER_LINES: readonly string[] = [
  "Father, I've been trying to pay",
  "for what You already gave.",
  "Help me stop keeping score.",
  "Today I choose You. Amen.",
];

export const PRAY_SCENE = { sceneMs: 1500, fromMs: LIFTED_AT_MS + 100, lineMs: 280 } as const;

export type PrayScene = { shownLines: number; glowing: boolean };

export function getPrayScene(elapsedMs: number): PrayScene {
  return {
    shownLines: countFrom(
      elapsedMs,
      PRAY_SCENE.fromMs - PRAY_SCENE.lineMs,
      PRAY_SCENE.lineMs,
      PRAYER_LINES.length,
    ),
    // The glow belongs to the moment of prayer, not the card at rest.
    glowing: elapsedMs >= LIFT.startMs && elapsedMs < LIFTED_AT_MS + PRAY_SCENE.sceneMs,
  };
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
