import { LIFTED_AT_MS } from "./lift-timing";

/**
 * Each lifted piece's little scene, as a pure function of how long its turn
 * has been playing — written as if its lift were the turn's only one, timed
 * from `LIFTED_AT_MS` (see `lift-timing`). Before its lift a piece is at 0ms;
 * once the card's turn is over it is at `Infinity`.
 */

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
