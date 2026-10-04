import { z } from "zod";

import { getAppDatabase } from "./database/app-database";

const reflectionAnswerRowSchema = z.object({
  reflection_id: z.string().min(1),
  answer: z.string(),
  answered_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export type LocalReflectionAnswer = {
  reflectionId: string;
  answer: string;
  answeredAt: string;
  updatedAt: string;
};

const reflectionWriteQueues = new Map<string, Promise<void>>();

/** Reads only this user's requested private answers from the device database. */
export async function getReflectionAnswers(
  userId: string,
  reflectionIds: readonly string[],
): Promise<Record<string, LocalReflectionAnswer>> {
  if (reflectionIds.length === 0) return {};
  const db = await getAppDatabase();
  const placeholders = reflectionIds.map(() => "?").join(", ");
  const rows = await db.query(
    `SELECT reflection_id, answer, answered_at, updated_at
       FROM reflection_answers
      WHERE user_id = ?
        AND reflection_id IN (${placeholders})`,
    [userId, ...reflectionIds],
  );

  const result: Record<string, LocalReflectionAnswer> = {};
  for (const row of rows) {
    const parsed = reflectionAnswerRowSchema.safeParse(row);
    if (!parsed.success) continue;
    result[parsed.data.reflection_id] = {
      reflectionId: parsed.data.reflection_id,
      answer: parsed.data.answer,
      answeredAt: parsed.data.answered_at,
      updatedAt: parsed.data.updated_at,
    };
  }
  return result;
}

/**
 * Autosaves one private answer for the current SundayBest user. Empty answers
 * are removed rather than counted as notes. Nothing in this module has an API
 * dependency, by design.
 */
export function saveReflectionAnswer(
  userId: string,
  reflectionId: string,
  answer: string,
): Promise<void> {
  // TextInput can emit faster than SQLite writes settle. Serialize writes per
  // user/reflection so an older keystroke can never finish after a newer one
  // and overwrite the latest device-only answer on disk.
  const queueKey = `${userId}:${reflectionId}`;
  const previous = reflectionWriteQueues.get(queueKey) ?? Promise.resolve();
  const queued = previous
    .catch(() => undefined)
    .then(async () => {
      const db = await getAppDatabase();
      if (answer.length === 0) {
        await db.execute(
          "DELETE FROM reflection_answers WHERE user_id = ? AND reflection_id = ?",
          [userId, reflectionId],
        );
        return;
      }

      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO reflection_answers
           (user_id, reflection_id, answer, answered_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, reflection_id) DO UPDATE SET
           answer = excluded.answer,
           updated_at = excluded.updated_at`,
        [userId, reflectionId, answer, now, now],
      );
    });

  reflectionWriteQueues.set(queueKey, queued);
  const cleanup = () => {
    if (reflectionWriteQueues.get(queueKey) === queued) {
      reflectionWriteQueues.delete(queueKey);
    }
  };
  void queued.then(cleanup, cleanup);
  return queued;
}

export async function countReflectionAnswers(
  userId: string,
  reflectionIds: readonly string[],
): Promise<number> {
  const answers = await getReflectionAnswers(userId, reflectionIds);
  return Object.values(answers).filter(({ answer }) => answer.trim().length > 0).length;
}
