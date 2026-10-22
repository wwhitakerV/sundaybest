import { getAppDatabase } from "./database/app-database";

/**
 * Every table holding a reader's data on the phone. The migrations' own
 * record stays, so the database reopens at its version, simply empty.
 */
const READER_TABLES = [
  "api_resource_cache",
  "mutation_outbox",
  "reflection_answers",
  "reflection_lines",
  "liked_verses",
  "searches_shown",
  "moments_seen",
  "game_results",
] as const;

/**
 * Empties the phone's database of everything a reader left there — the
 * offline cache, changes waiting to sync, what they wrote, liked and saw —
 * in one transaction. The database's key stays, so it reopens as it was,
 * only empty. Development's "Start over" only (`start-over.ts`).
 */
export async function wipeDeviceData(): Promise<void> {
  const db = await getAppDatabase();
  await db.transaction(async (tx) => {
    for (const table of READER_TABLES) {
      await tx.execute(`DELETE FROM ${table}`);
    }
  });
}
