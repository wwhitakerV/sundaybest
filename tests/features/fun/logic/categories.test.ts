import { FUN_CATEGORIES, getCategoryView } from "@/features/fun/logic/categories";

describe("FUN_CATEGORIES", () => {
  it("lists Fun's categories in order", () => {
    expect(FUN_CATEGORIES).toEqual(["Quick Play", "Multiplayer", "Trivia", "Exams", "Streaks"]);
  });
});

describe("getCategoryView", () => {
  it.each([
    ["Quick Play", "quick-play", ["duel", "trivia", "exams", "verse-builder"]],
    ["Multiplayer", "play-now", ["duel"]],
    ["Trivia", "play-now", ["trivia"]],
    ["Exams", "play-now", ["exams"]],
    ["Streaks", "play-now", ["trivia"]],
  ] as const)("takes %s to %s, showing %j", (category, section, games) => {
    expect(getCategoryView(category)).toEqual({ section, games });
  });
});
