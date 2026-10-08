import { useEffect, type ReactNode } from "react";

import { useRemindersQuery, useUserSettingsQuery } from "@/core/api/reader-queries";
import { syncLocalReminder } from "@/core/notifications/local-reminders";
import { TextScaleScope, textScaleFor } from "@/theme";

/** Applies server-owned preferences without making UI components depend on core/network code. */
export function ServerPreferences({ children }: { children: ReactNode }) {
  const settingsQuery = useUserSettingsQuery();
  const remindersQuery = useRemindersQuery();
  const scale = textScaleFor(settingsQuery.data?.settings.textSize ?? "default");

  useEffect(() => {
    const daily = remindersQuery.data?.reminders.find((reminder) => reminder.kind === "dailyStudy");
    if (!daily) return;
    void syncLocalReminder(daily).catch(() => {
      // Notification scheduling is a convenience. A native scheduling failure
      // must not make settings or the rest of app startup fail.
    });
  }, [remindersQuery.data]);

  return <TextScaleScope scale={scale}>{children}</TextScaleScope>;
}
