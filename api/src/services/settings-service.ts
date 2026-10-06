import { and, eq, isNull } from "drizzle-orm";

import type { ApiUserSettings, ReminderKind, UpdateReminderRequest, UpdateSettingsRequest } from "../contracts/settings.js";
import type { Database } from "../db/client.js";
import { reminders, userSettings } from "../db/schema.js";
import { AppError } from "../http/errors.js";

const DEFAULT_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** `availableTranslations` is what the configured Bible providers can serve. */
export function createSettingsService(db: Database, availableTranslations: readonly ApiUserSettings["bibleTranslation"][]) {
  async function getSettings(userId: string) {
    let rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    if (!rows[0]) {
      await db.insert(userSettings).values({ userId }).onConflictDoNothing();
      rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    }
    if (!rows[0]) throw new AppError("INTERNAL", "Settings could not be loaded");
    return toSettings(rows[0]);
  }

  return {
    getSettings,
    async updateSettings(userId: string, input: UpdateSettingsRequest) {
      if (input.bibleTranslation && !availableTranslations.includes(input.bibleTranslation)) {
        throw new AppError("VALIDATION_FAILED", "That Bible translation isn't available");
      }
      await getSettings(userId);
      const rows = await db
        .update(userSettings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      if (!rows[0]) throw new AppError("INTERNAL", "Settings could not be updated");
      return toSettings(rows[0]);
    },
    async listReminders(userId: string) {
      const rows = await db
        .select()
        .from(reminders)
        .where(and(eq(reminders.userId, userId), isNull(reminders.planId)));
      return rows.map(toReminder);
    },
    async updateReminder(userId: string, kind: ReminderKind, input: UpdateReminderRequest) {
      const rows = await db
        .select()
        .from(reminders)
        .where(and(eq(reminders.userId, userId), eq(reminders.kind, kind), isNull(reminders.planId)))
        .limit(1);
      const current = rows[0];
      if (current) {
        const [updated] = await db
          .update(reminders)
          .set({
            ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
            ...(input.time === undefined ? {} : { localTime: `${input.time}:00` }),
            ...(input.days === undefined ? {} : { weekdays: input.days }),
            updatedAt: new Date(),
          })
          .where(eq(reminders.id, current.id))
          .returning();
        if (!updated) throw new AppError("INTERNAL");
        return toReminder(updated);
      }

      const [created] = await db
        .insert(reminders)
        .values({
          userId,
          kind,
          enabled: input.enabled ?? false,
          localTime: `${input.time ?? "08:00"}:00`,
          weekdays: input.days ?? DEFAULT_DAYS,
        })
        .returning();
      if (!created) throw new AppError("INTERNAL");
      return toReminder(created);
    },
  };
}

function toSettings(row: typeof userSettings.$inferSelect) {
  const offset = row.readingTextOffset as -4 | -2 | 0 | 2 | 4 | 6 | 8;
  const length = row.defaultPlanLength as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return {
    userId: row.userId,
    theme: row.theme,
    textSize: row.textSize,
    bibleTranslation: row.bibleTranslation,
    defaultPlanLength: length,
    quickCheckByDefault: row.quickCheckByDefault,
    hapticsEnabled: row.hapticsEnabled,
    readingTextOffset: offset,
    readingPaper: row.readingPaper,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as const;
}

function toReminder(row: typeof reminders.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    planId: row.planId,
    enabled: row.enabled,
    time: row.localTime.slice(0, 5),
    days: row.weekdays as Array<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat">,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as const;
}
