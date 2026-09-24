import type { Entity, Id, IsoDateTime } from "./common";
import type { BibleTranslation } from "./scripture";
import type { PlanLength } from "./plan";

/**
 * The person using the app on this device. There are no accounts or sign-in:
 * this is a local profile, created the first time the app opens.
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
};
