import { eq } from "drizzle-orm";

import type { ApiWord } from "../contracts/word.js";
import type { Database } from "../db/client.js";
import { userSettings } from "../db/schema.js";
import { localDateInTimeZone } from "../domain/time.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import { loadScripture } from "./study-service.js";
import { getScheduledDays, type ScheduledDay } from "./week-service.js";

/**
 * The Word: every passage the reader has finished — each once, by its
 * latest study — with its text in their translation.
 */
export function createWordService(db: Database, bibleProvider: BibleProvider) {
  return {
    async get(userId: string, timezone: string): Promise<ApiWord> {
      const today = localDateInTimeZone(new Date(), timezone);
      const [days, settingsRows] = await Promise.all([
        getScheduledDays(db, userId, today),
        db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
      ]);
      const translation = settingsRows[0]?.bibleTranslation;

      // Newest first, so the first study of a passage met is its latest.
      const latest = new Map<string, ScheduledDay & { completedAt: Date }>();
      for (const day of days
        .filter((candidate): candidate is ScheduledDay & { completedAt: Date } =>
          Boolean(candidate.completedAt),
        )
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())) {
        if (!latest.has(day.scripture.canonicalReference)) {
          latest.set(day.scripture.canonicalReference, day);
        }
      }

      const passages = await Promise.all(
        [...latest.values()].map(async (day) => ({
          reference: day.scripture.canonicalReference,
          book: day.scripture.book,
          chapter: day.scripture.chapter,
          verseStart: day.scripture.verseStart,
          text: translation ? await textOf(db, bibleProvider, day, translation) : null,
          planId: day.planId,
          dayNumber: day.dayNumber,
          completedAt: day.completedAt.toISOString(),
        })),
      );

      return { translation: translation ?? "BSB", passages };
    },
  };
}

/** A passage's text, its verses run together — or null when it can't be had just now: the list still shows the passage. */
async function textOf(
  db: Database,
  bibleProvider: BibleProvider,
  day: ScheduledDay,
  translation: Parameters<typeof loadScripture>[3],
): Promise<string | null> {
  try {
    const { verses } = await loadScripture(db, bibleProvider, day.scripture, translation);
    const text = verses
      .map((verse) => verse.text.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
