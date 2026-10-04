import * as Notifications from "expo-notifications";

import type { ApiReminder } from "@/core/api/contracts";
import type { Weekday } from "@/types/domain";

function weekdayNumber(day: Weekday): number {
  switch (day) {
    case "sun":
      return 1;
    case "mon":
      return 2;
    case "tue":
      return 3;
    case "wed":
      return 4;
    case "thu":
      return 5;
    case "fri":
      return 6;
    case "sat":
      return 7;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Replaces only SundayBest notifications for one reminder kind. */
export async function syncLocalReminder(reminder: ApiReminder): Promise<void> {
  await cancelLocalReminder(reminder.kind);
  if (!reminder.enabled) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const [hourText, minuteText] = reminder.time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  await Promise.all(
    reminder.days.map((day) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "SundayBest",
          body:
            reminder.kind === "dailyStudy"
              ? "Your daily study is ready."
              : "Your Quick Check is waiting.",
          data: { sundayBestReminderKind: reminder.kind },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekdayNumber(day),
          hour,
          minute,
        },
      }),
    ),
  );
}

export async function cancelLocalReminder(kind: ApiReminder["kind"]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((request) => request.content.data?.sundayBestReminderKind === kind);
  await Promise.all(
    matching.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}
