import { z } from "zod";

import type { FunGame } from "../types";

/**
 * Everywhere Fun leads: its games, every game at once, and the invitation to
 * friends. None is built yet; each opens a "Coming soon" page of its own
 * inside Fun's stack, never some other screen.
 */
const funDestinationSchema = z.enum([
  "heads-up",
  "duel",
  "daily-trivia",
  "theology-exams",
  "verse-builder",
  "all-games",
  "challenge-friends",
]);

export type FunDestination = z.infer<typeof funDestinationSchema>;

/** A route's `destination` param, if it's one Fun knows — anything else is null. */
export function parseFunDestination(param: unknown): FunDestination | null {
  const parsed = funDestinationSchema.safeParse(param);
  return parsed.success ? parsed.data : null;
}

/** A destination's name, as Fun shows it. */
export function getFunDestinationTitle(destination: FunDestination): string {
  switch (destination) {
    case "heads-up":
      return "Heads Up: Bible Characters";
    case "duel":
      return "1v1 Duel";
    case "daily-trivia":
      return "Daily Trivia";
    case "theology-exams":
      return "Theology Exams";
    case "verse-builder":
      return "Verse Builder";
    case "all-games":
      return "All games";
    case "challenge-friends":
      return "Challenge friends";
  }
}

/** Where a Play now game opens. */
export function getGameDestination(game: FunGame): FunDestination {
  switch (game) {
    case "duel":
      return "duel";
    case "trivia":
      return "daily-trivia";
    case "exams":
      return "theology-exams";
    case "verse-builder":
      return "verse-builder";
  }
}

export function funDestinationHref(destination: FunDestination) {
  return { pathname: "/(tabs)/fun/[destination]", params: { destination } } as const;
}
