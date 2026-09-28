import {
  funDestinationHref,
  getFunDestinationTitle,
  getGameDestination,
  getGameHref,
  parseFunDestination,
} from "@/features/fun/logic/destinations";
import { theologyExamsHref } from "@/features/exams";

describe("parseFunDestination", () => {
  it.each(["heads-up", "duel", "daily-trivia", "verse-builder", "all-games", "challenge-friends"])(
    "accepts %s",
    (destination) => {
      expect(parseFunDestination(destination)).toBe(destination);
    },
  );

  // "theology-exams" moved off "Coming soon" onto its own real screen — it's
  // no longer a destination this Coming soon param recognizes.
  it.each([undefined, "", "exams", "plans", "theology-exams", ["duel"], 3])(
    "turns away %p",
    (param) => {
      expect(parseFunDestination(param)).toBeNull();
    },
  );
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
    ["verse-builder", "verse-builder"],
  ] as const)("sends %s to %s", (game, destination) => {
    expect(getGameDestination(game)).toBe(destination);
  });
});

describe("getGameHref", () => {
  it("sends Theology Exams to the exam route, not a Coming soon destination", () => {
    expect(getGameHref("exams")).toBe(theologyExamsHref);
  });

  it.each([
    ["duel", funDestinationHref("duel")],
    ["trivia", funDestinationHref("daily-trivia")],
    ["verse-builder", funDestinationHref("verse-builder")],
  ] as const)("sends %s to its own Coming soon destination", (game, expected) => {
    expect(getGameHref(game)).toEqual(expected);
  });
});
