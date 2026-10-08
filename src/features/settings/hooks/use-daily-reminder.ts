import { Alert } from "react-native";

import { useRemindersQuery, useUpdateReminderMutation } from "@/core/api/reader-queries";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";
import type { Weekday } from "@/types/domain";
import { toggleReminderDay, WEEK } from "../logic/reminder-days";

/**
 * Daily reminder's view model: the reminder as the server has it, and the
 * changes to it. Saves are optimistic, so nothing on the page waits on them —
 * a second tap while one is out is simply ignored.
 */
export function useDailyReminder() {
  const remindersQuery = useRemindersQuery();
  const update = useUpdateReminderMutation();
  const reminder = remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy");
  const days = reminder?.days ?? WEEK;

  function save(input: Parameters<typeof update.mutate>[0]["input"], failure: string) {
    update.mutate(
      { kind: "dailyStudy", input },
      { onError: () => Alert.alert(failure, "Try again in a moment.") },
    );
  }

  async function setEnabled(enabled: boolean) {
    if (update.isPending) return;

    if (enabled) {
      let granted = false;
      try {
        granted = await requestNotificationPermission();
      } catch {
        granted = false;
      }

      if (!granted) {
        Alert.alert(
          "Notifications are off",
          "Allow notifications for SundayBest in iPhone Settings to use a daily reminder.",
        );
        return;
      }
    }

    save({ enabled }, "Couldn’t update reminder");
  }

  return {
    enabled: reminder?.enabled ?? false,
    time: reminder?.time ?? "08:00",
    days,
    setEnabled: (enabled: boolean) => void setEnabled(enabled),
    setTime: (time: string) => save({ time }, "Couldn’t update reminder time"),
    toggleDay: (day: Weekday) => {
      if (update.isPending) return;
      const next = toggleReminderDay(days, day);
      if (next !== days) save({ days: [...next] }, "Couldn’t update reminder days");
    },
  } as const;
}
