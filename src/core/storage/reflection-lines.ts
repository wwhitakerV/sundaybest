import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

const lineRowSchema = z.object({
  reflection_id: z.string().min(1),
  written_on: z.string().min(1),
  text: z.string(),
});

/** A line added later to what was written: the day it was written, and its words. */
export type ReflectionLine = { writtenOn: string; text: string };

const lineWriteQueues = new Map<string, Promise<void>>();

/**
 * Every line this user has added to their reflections on this device, by
 * reflection, oldest day first. Device-only: nothing here has an API path.
 */
export async function getAllReflectionLines(
  userId: string,
): Promise<Record<string, ReflectionLine[]>> {
  const db = await getAppDatabase();
  const rows = await db.query(
    `SELECT reflection_id, written_on, text
       FROM reflection_lines
      WHERE user_id = ?
      ORDER BY written_on ASC`,
    [userId],
  );
  const result: Record<string, ReflectionLine[]> = {};
  for (const row of rows) {
    const parsed = lineRowSchema.safeParse(row);
    if (!parsed.success || parsed.data.text.trim().length === 0) continue;
    const { reflection_id: id, written_on: writtenOn, text } = parsed.data;
    result[id] = [...(result[id] ?? []), { writtenOn, text }];
  }
  return result;
}

/**
 * Saves the line this user added to a reflection on a day — one a day, the
 * original never touched. Empty, it's removed. Writes to one line run in
 * order, so an older keystroke never lands after a newer one.
 */
export function saveReflectionLine(
  userId: string,
  reflectionId: string,
  writtenOn: string,
  text: string,
): Promise<void> {
  const queueKey = `${userId}:${reflectionId}:${writtenOn}`;
  const previous = lineWriteQueues.get(queueKey) ?? Promise.resolve();
  const queued = previous
    .catch(() => undefined)
    .then(async () => {
      const db = await getAppDatabase();
      if (text.trim().length === 0) {
        await db.execute(
          "DELETE FROM reflection_lines WHERE user_id = ? AND reflection_id = ? AND written_on = ?",
          [userId, reflectionId, writtenOn],
        );
        return;
      }
      await db.execute(
        `INSERT INTO reflection_lines (user_id, reflection_id, written_on, text, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, reflection_id, written_on) DO UPDATE SET
           text = excluded.text,
           updated_at = excluded.updated_at`,
        [userId, reflectionId, writtenOn, text, new Date().toISOString()],
      );
    });

  lineWriteQueues.set(queueKey, queued);
  const cleanup = () => {
    if (lineWriteQueues.get(queueKey) === queued) lineWriteQueues.delete(queueKey);
  };
  void queued.then(cleanup, cleanup);
  return queued;
}

/** Clears the lines added to these reflections — with their answers, on a plan reset. */
export async function deleteReflectionLines(
  userId: string,
  reflectionIds: readonly string[],
): Promise<void> {
  if (reflectionIds.length === 0) return;
  const db = await getAppDatabase();
  const placeholders = reflectionIds.map(() => "?").join(", ");
  await db.execute(
    `DELETE FROM reflection_lines WHERE user_id = ? AND reflection_id IN (${placeholders})`,
    [userId, ...reflectionIds],
  );
}
