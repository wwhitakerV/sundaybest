import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

/** The daily games whose results are kept on the phone: RISE, and The 99 (retired, its results kept). */
export type Game = "rise" | "the-99";

const resultRowSchema = z.object({
  daily: z.number().int().positive(),
  survived_ms: z.number().int().nonnegative(),
  saved: z.number().int().nonnegative().nullable(),
  detail: z.string().nullable().optional(),
});

/**
 * A day's result: which day's game, its score (`saved`: The 99's sheep,
 * RISE's right answers), a time (`survivedMs`: how long The 99's flock
 * lasted; RISE's time to spare, its tiebreaker), and the game's own
 * account of the run (`detail`, its JSON — parsed by the game that wrote it).
 */
export type GameResult = {
  daily: number;
  saved: number | null;
  survivedMs: number;
  detail?: string | null;
};

/** This reader's results in a game on this phone, every day played. A row not understood is left out. */
export async function getGameResults(userId: string, game: Game): Promise<GameResult[]> {
  const db = await getAppDatabase();
  const rows = await db.query(
    "SELECT daily, survived_ms, saved, detail FROM game_results WHERE user_id = ? AND game = ?",
    [userId, game],
  );
  return rows.flatMap((row) => {
    const parsed = resultRowSchema.safeParse(row);
    return parsed.success
      ? [
          {
            daily: parsed.data.daily,
            saved: parsed.data.saved,
            survivedMs: parsed.data.survived_ms,
            detail: parsed.data.detail ?? null,
          },
        ]
      : [];
  });
}

/** Records a day's result — once: a day is played once, and its first result stands. */
export async function recordGameResult(
  userId: string,
  game: Game,
  result: GameResult,
): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    "INSERT OR IGNORE INTO game_results (user_id, game, daily, survived_ms, saved, detail, played_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      game,
      result.daily,
      Math.round(result.survivedMs),
      result.saved,
      result.detail ?? null,
      new Date().toISOString(),
    ],
  );
}

/** Forgets a day's result, so it can be played again — development builds' replay only. */
export async function forgetGameResult(userId: string, game: Game, daily: number): Promise<void> {
  const db = await getAppDatabase();
  await db.execute("DELETE FROM game_results WHERE user_id = ? AND game = ? AND daily = ?", [
    userId,
    game,
    daily,
  ]);
}
