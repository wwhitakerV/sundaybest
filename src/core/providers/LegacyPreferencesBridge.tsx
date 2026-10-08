import { useEffect } from "react";

import { useRemindersQuery, useUserSettingsQuery } from "@/core/api/reader-queries";
import { getReminder, getUserSettings, useAppSelector, useStoreActions } from "@/core/store";

/**
 * Temporary bridge while Plans/Study still read the legacy mock store.
 *
 * The API remains canonical. This mirrors only user preferences into the old
 * store so changing a real setting (Bible translation, plan defaults, etc.)
 * also affects the still-mock-backed screens. Delete this when those slices
 * move to API queries.
 */
export function LegacyPreferencesBridge() {
  const settingsQuery = useUserSettingsQuery();
  const remindersQuery = useRemindersQuery();
  const localSettings = useAppSelector(getUserSettings);
  const localDaily = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const localQuickCheck = useAppSelector((state) => getReminder(state, "quickCheck"));
  const actions = useStoreActions();

  useEffect(() => {
    const server = settingsQuery.data?.settings;
    if (!server) return;

    if (localSettings.bibleTranslation !== server.bibleTranslation) {
      actions.updateBibleTranslation(server.bibleTranslation);
    }
    if (localSettings.textSize !== server.textSize) actions.updateTextSize(server.textSize);
    if (localSettings.theme !== server.theme) actions.updateTheme(server.theme);
    if (localSettings.defaultPlanLength !== server.defaultPlanLength) {
      actions.updateDefaultPlanLength(server.defaultPlanLength);
    }
    if (localSettings.quickCheckByDefault !== server.quickCheckByDefault) {
      actions.updateQuickCheckByDefault(server.quickCheckByDefault);
    }
    if (localSettings.hapticsEnabled !== server.hapticsEnabled) {
      actions.updateHapticsEnabled(server.hapticsEnabled);
    }
    if (localSettings.readingTextOffset !== server.readingTextOffset) {
      actions.setReadingTextOffset(server.readingTextOffset);
    }
    if (localSettings.readingPaper !== server.readingPaper) {
      actions.setReadingPaper(server.readingPaper);
    }
  }, [actions, localSettings, settingsQuery.data]);

  useEffect(() => {
    const serverReminders = remindersQuery.data?.reminders;
    if (!serverReminders) return;

    for (const local of [localDaily, localQuickCheck]) {
      if (!local) continue;
      const server = serverReminders.find((candidate) => candidate.kind === local.kind);
      if (!server) continue;

      if (local.enabled !== server.enabled) actions.setReminderEnabled(local.id, server.enabled);
      if (local.time !== server.time) actions.setReminderTime(local.id, server.time);
      if (!sameDays(local.days, server.days)) actions.setReminderDays(local.id, [...server.days]);
    }
  }, [actions, localDaily, localQuickCheck, remindersQuery.data]);

  return null;
}

function sameDays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((day, index) => day === right[index]);
}
