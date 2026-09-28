import type { FunGame } from "../types";

/** Fun's categories, in the order its chip row shows them. */
export const FUN_CATEGORIES = ["Quick Play", "Multiplayer", "Trivia", "Exams", "Streaks"] as const;

export type FunCategory = (typeof FUN_CATEGORIES)[number];

/** Where a category takes the page, and which games Play now shows under it. */
export type FunCategoryView = {
  section: "quick-play" | "play-now";
  games: FunGame[];
};

const ALL_GAMES: FunGame[] = ["duel", "trivia", "exams", "verse-builder"];

/**
 * What picking a category does: Quick Play goes back to the top with every
 * game; the rest go to Play now, narrowed to their games — Multiplayer to the
 * duel, Trivia and Streaks to Daily Trivia (the game with a streak), Exams to
 * Theology Exams.
 */
export function getCategoryView(category: FunCategory): FunCategoryView {
  switch (category) {
    case "Multiplayer":
      return { section: "play-now", games: ["duel"] };
    case "Trivia":
    case "Streaks":
      return { section: "play-now", games: ["trivia"] };
    case "Exams":
      return { section: "play-now", games: ["exams"] };
    default:
      return { section: "quick-play", games: ALL_GAMES };
  }
}
