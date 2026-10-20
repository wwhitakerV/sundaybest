import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

const likedRowSchema = z.object({ verse_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** The days whose verse this reader has liked, on this phone. A row not understood is left out. */
export async function getLikedVerses(userId: string): Promise<string[]> {
  const db = await getAppDatabase();
  const rows = await db.query("SELECT verse_date FROM liked_verses WHERE user_id = ?", [userId]);
  return rows.flatMap((row) => {
    const parsed = likedRowSchema.safeParse(row);
    return parsed.success ? [parsed.data.verse_date] : [];
  });
}

/** Records that this reader liked the day's verse, and where it's from. */
export async function likeVerse(
  userId: string,
  verse: { date: string; reference: string },
): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    "INSERT OR REPLACE INTO liked_verses (user_id, verse_date, reference, liked_at) VALUES (?, ?, ?, ?)",
    [userId, verse.date, verse.reference, new Date().toISOString()],
  );
}

/** Takes this reader's like of the day's verse back. */
export async function unlikeVerse(userId: string, date: string): Promise<void> {
  const db = await getAppDatabase();
  await db.execute("DELETE FROM liked_verses WHERE user_id = ? AND verse_date = ?", [userId, date]);
}
