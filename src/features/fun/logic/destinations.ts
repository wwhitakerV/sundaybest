import { z } from "zod";

import { theologyExamsHref } from "@/features/exams";
import type { FunGame } from "../types";

/**
 * Where Fun leads that isn't built yet: each opens a "Coming soon" page of its
 * own inside Fun's stack, never some other screen. Theology Exams is built —
 * it has its own screen now, and is no longer one of these.
 */
const funDestinationSchema = z.enum([
  "heads-up",
  "duel",
  "daily-trivia",
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
    case "verse-builder":
      return "Verse Builder";
    case "all-games":
      return "All games";
    case "challenge-friends":
      return "Challenge friends";
  }
}

/** The "Coming soon" page a Play now game opens while it isn't built. */
export function getGameDestination(game: Exclude<FunGame, "exams">): FunDestination {
  switch (game) {
    case "duel":
      return "duel";
    case "trivia":
      return "daily-trivia";
    case "verse-builder":
      return "verse-builder";
  }
}

export function funDestinationHref(destination: FunDestination) {
  return { pathname: "/(tabs)/fun/[destination]", params: { destination } } as const;
}

/** Where a Play now game opens: Theology Exams' own screen, or another game's Coming soon page. */
export function getGameHref(game: FunGame) {
  return game === "exams" ? theologyExamsHref : funDestinationHref(getGameDestination(game));
}
