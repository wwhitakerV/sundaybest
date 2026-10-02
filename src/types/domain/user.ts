import type { Entity, Id, IsoDateTime } from "./common";
import type { BibleTranslation } from "./scripture";
import type { PlanLength } from "./plan";

/**
 * The person using this install. The production backend can create this user
 * anonymously from the attested install; Sign in with Apple can later link the
 * anonymous user for cross-device restore without changing the app-facing shape.
 */
export type User = Entity & {
  /** What the app calls them, if they've said. */
  displayName: string | null;
  /** When they finished Welcome; null until then. */
  onboardedAt: IsoDateTime | null;
};

export type ThemePreference = "system" | "light" | "dark";

/** Reading text size, from Settings → Text size. */
export type TextSize = "small" | "default" | "large" | "extraLarge";

/** One user's preferences. */
/** The paper the Daily Study is read on: four lights, two darks. */
export type ReadingPaper = "white" | "ivory" | "cream" | "sepia" | "dusk" | "night";

export type UserSettings = Entity & {
  userId: Id;
  theme: ThemePreference;
  textSize: TextSize;
  bibleTranslation: BibleTranslation;
  /** The length New Plan starts on. */
  defaultPlanLength: PlanLength;
  /** Whether new plans include a Quick Check quiz by default. */
  quickCheckByDefault: boolean;
  hapticsEnabled: boolean;
  /** Points added to (or taken from) the Daily Study's text, from its reading sheet. */
  readingTextOffset: number;
  /** The paper the Daily Study is read on. */
  readingPaper: ReadingPaper;
};
