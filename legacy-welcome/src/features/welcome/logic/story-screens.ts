import { STORY_CARDS, type StoryPhase, type StoryScreen } from "./story";

/**
 * What the stage's phone shows at each point of the story: which screen,
 * which of its steps, how it got there, and the caption under it — worked
 * out from the story's cards (`STORY_CARDS`) and the phase it's in.
 */

const FIRST_CARD = 0;
const LAST_CARD = STORY_CARDS.length - 1;

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
