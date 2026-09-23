import {
  PASTE_SCENE,
  PLAN_SCENE,
  PRAY_SCENE,
  PREVIEW_SCENE,
  QUIZ_SCENE,
  READ_SCENE,
  REFLECT_SCENE,
  getTurnMs,
} from "./scenes";

/**
 * The Welcome screen's intro story, as data. The stage, its phones, the
 * lifted piece of UI, and the step caption all render from the current
 * `StoryPhase`; nothing here knows about React or animation, only where
 * things should be.
 */

/**
 * The cards, in deck order; the how-it-works step each illustrates (`word`
 * picks out which comma-separated item of step 3, "Read, reflect, pray, and
 * quiz", it stands for); and how long its scene plays once its UI has lifted
 * off the phone.
 */
export const STORY_CARDS = [
  { key: "paste", step: 0, word: null, sceneMs: PASTE_SCENE.sceneMs },
  { key: "plan", step: 1, word: null, sceneMs: PLAN_SCENE.sceneMs },
  // The same screen with the days picked: its sermon card is tapped into.
  // Still step 2, so its caption holds.
  { key: "preview", step: 1, word: null, sceneMs: PREVIEW_SCENE.sceneMs },
  { key: "read", step: 2, word: 0, sceneMs: READ_SCENE.sceneMs },
  { key: "reflect", step: 2, word: 1, sceneMs: REFLECT_SCENE.sceneMs },
  { key: "pray", step: 2, word: 2, sceneMs: PRAY_SCENE.sceneMs },
  { key: "quiz", step: 2, word: 3, sceneMs: QUIZ_SCENE.sceneMs },
] as const;

export type StoryCardKey = (typeof STORY_CARDS)[number]["key"];

const FIRST_CARD = 0;
const LAST_CARD = STORY_CARDS.length - 1;

/**
 * - `arrive` — the stage fades in and rises, the first card already on it as
 *   the big phone; nothing has started playing.
 * - `focus` — a card's turn.
 * - `leave` — the last card's turn is over; the stage fades down and out.
 */
export type StoryPhase =
  { kind: "arrive" } | { kind: "focus"; card: StoryCardKey } | { kind: "leave" };

/** A phase and how long to hold it before the next. */
export type StoryBeat = { phase: StoryPhase; holdMs: number };

/** The whole stage fading in and rising, and fading down and out. */
export const STAGE_FADE = { inMs: 700, outMs: 600 } as const;
/** After the stage has faded in, a breath before the first turn begins. */
const ARRIVE_PAUSE_MS = 200;
/** After it has faded out, a pause before it comes back. */
const LEAVE_PAUSE_MS = 600;

/**
 * One loop of the story: the stage arrives with the first card on it, each
 * card takes its turn, and the stage leaves — then it all begins again.
 */
export const STORY_BEATS: readonly StoryBeat[] = [
  { phase: { kind: "arrive" }, holdMs: STAGE_FADE.inMs + ARRIVE_PAUSE_MS },
  ...STORY_CARDS.map((card) => ({
    phase: { kind: "focus", card: card.key } as const,
    holdMs: getTurnMs(card.sceneMs),
  })),
  { phase: { kind: "leave" }, holdMs: STAGE_FADE.outMs + LEAVE_PAUSE_MS },
];

/** Whether the stage is showing (it fades out while leaving). */
export function isStageShown(phase: StoryPhase): boolean {
  return phase.kind !== "leave";
}

/** How long card `key`'s scene plays once its UI has lifted. */
export function getSceneMsFor(key: StoryCardKey): number {
  return STORY_CARDS.find((card) => card.key === key)?.sceneMs ?? 0;
}

/**
 * How long cards take to move into a phase's poses. Arriving snaps: the
 * stage is invisible then (on mount, or faded out at the end of a loop).
 */
export function getPoseDurationMs(phase: StoryPhase): number {
  return phase.kind === "arrive" ? 0 : 750;
}

/** Which card is the big phone in `phase`. */
function getOnStageIndex(phase: StoryPhase): number {
  switch (phase.kind) {
    case "arrive":
      return FIRST_CARD;
    case "leave":
      return LAST_CARD;
    case "focus":
      return STORY_CARDS.findIndex((card) => card.key === phase.card);
  }
}

// ---------------------------------------------------------------------------
// Card poses
// ---------------------------------------------------------------------------

export type CardPose = {
  /** Tilt about the fan's pivot, below the card. */
  rotateDeg: number;
  x: number;
  y: number;
  /** Size about the card's top centre, relative to the size it's built at. */
  scale: number;
  opacity: number;
  zIndex: number;
};

export type StageOptions = {
  /**
   * Cards are built at their on-stage size and shown smaller everywhere else,
   * so they only ever scale down. This is that smaller size.
   */
  restScale: number;
  /** How dimmed the cards around the one on stage are (0–1). */
  supportOpacity: number;
};

/**
 * Around the card on stage, the rest of the hand fans out behind it: cards
 * that have had their turn to the left, cards still to come to the right,
 * each further out the further it is from its turn.
 */
const SIDE_BASE_DEG = 20;
const SIDE_STEP_DEG = 6;
/** Only the two nearest cards on each side show; the rest tuck away. */
const SIDE_VISIBLE = 2;
const Z_ON_STAGE = 200;
const Z_SIDE = 150;

/** Where card `index` (deck order) sits during `phase`. */
export function getCardPose(index: number, phase: StoryPhase, stage: StageOptions): CardPose {
  const onStage = getOnStageIndex(phase);
  if (index === onStage) {
    // Upright, in front, at the full size it's built at.
    return { rotateDeg: 0, x: 0, y: 0, scale: 1, opacity: 1, zIndex: Z_ON_STAGE };
  }
  const offset = index - onStage;
  const distance = Math.abs(offset);
  return {
    rotateDeg: Math.sign(offset) * (SIDE_BASE_DEG + SIDE_STEP_DEG * (distance - 1)),
    x: 0,
    y: 0,
    scale: stage.restScale,
    opacity: distance <= SIDE_VISIBLE ? stage.supportOpacity : 0,
    zIndex: Z_SIDE - distance,
  };
}

// ---------------------------------------------------------------------------
// Scenes and caption
// ---------------------------------------------------------------------------

/** Where a card's turn is: not yet started, playing, or finished. */
export type SceneMode = "before" | "play" | "after";

export function getSceneMode(index: number, phase: StoryPhase): SceneMode {
  switch (phase.kind) {
    case "arrive":
      return "before";
    case "leave":
      return "after";
    case "focus": {
      const onStage = getOnStageIndex(phase);
      if (index === onStage) return "play";
      return index < onStage ? "after" : "before";
    }
  }
}

/**
 * The step line under the lifted UI: nothing before the first turn, or the
 * step on stage — with `word` picking out one item of step 3. While the
 * stage leaves, the last step stays up and fades out with it.
 */
export type CaptionState = { mode: "hidden" } | { mode: "step"; step: number; word: number | null };

export function getCaption(phase: StoryPhase): CaptionState {
  if (phase.kind === "arrive") return { mode: "hidden" };
  const card = STORY_CARDS.at(getOnStageIndex(phase));
  return card ? { mode: "step", step: card.step, word: card.word } : { mode: "hidden" };
}
