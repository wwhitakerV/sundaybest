import {
  funDestinationHref,
  getFunDestinationTitle,
  getGameDestination,
  parseFunDestination,
} from "@/features/fun/logic/destinations";

describe("parseFunDestination", () => {
  it.each([
    "heads-up",
    "duel",
    "daily-trivia",
    "theology-exams",
    "verse-builder",
    "all-games",
    "challenge-friends",
  ])("accepts %s", (destination) => {
    expect(parseFunDestination(destination)).toBe(destination);
  });

  it.each([undefined, "", "exams", "plans", ["duel"], 3])("turns away %p", (param) => {
    expect(parseFunDestination(param)).toBeNull();
  });
});

describe("funDestinationHref", () => {
  it("opens a destination inside Fun's own stack", () => {
    expect(funDestinationHref("duel")).toEqual({
      pathname: "/(tabs)/fun/[destination]",
      params: { destination: "duel" },
    });
  });
});

describe("getFunDestinationTitle", () => {
  it.each([
    ["heads-up", "Heads Up: Bible Characters"],
    ["duel", "1v1 Duel"],
    ["daily-trivia", "Daily Trivia"],
    ["theology-exams", "Theology Exams"],
    ["verse-builder", "Verse Builder"],
    ["all-games", "All games"],
    ["challenge-friends", "Challenge friends"],
  ] as const)("names %s as Fun shows it: %s", (destination, title) => {
    expect(getFunDestinationTitle(destination)).toBe(title);
  });
});

describe("getGameDestination", () => {
  it.each([
    ["duel", "duel"],
    ["trivia", "daily-trivia"],
    ["exams", "theology-exams"],
    ["verse-builder", "verse-builder"],
  ] as const)("sends %s to %s", (game, destination) => {
    expect(getGameDestination(game)).toBe(destination);
  });
});
