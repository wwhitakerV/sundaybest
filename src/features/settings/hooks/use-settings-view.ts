import { useRouter } from "expo-router";

import { useRemindersQuery, useUserSettingsQuery } from "@/core/api/reader-queries";
import { getAppVersion } from "@/core/config/app-version";
import { usesTwentyFourHourClock } from "@/core/localization/clock";
import {
  describeSettingsSections,
  formatShortVersion,
  type SettingsRow,
} from "../logic/settings-sections";

/** Settings' view model, backed by the real user settings/reminder API. */
export function useSettingsView() {
  const router = useRouter();
  const settingsQuery = useUserSettingsQuery();
  const remindersQuery = useRemindersQuery();
  const version = getAppVersion();
  const settings = settingsQuery.data?.settings;
  const reminder = remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy");

  return {
    sections:
      settings === undefined
        ? null
        : describeSettingsSections({
            reminderTime: reminder?.enabled ? reminder.time : null,
            twentyFourHour: usesTwentyFourHourClock(),
            translation: settings.bibleTranslation,
            textSize: settings.textSize,
          }),
    version: version ? formatShortVersion(version) : null,
    loading: settingsQuery.isPending || remindersQuery.isPending,
    failed: settingsQuery.isError || remindersQuery.isError,
    retry: () => {
      void settingsQuery.refetch();
      void remindersQuery.refetch();
    },
    open: (href: NonNullable<SettingsRow["href"]>) => router.push(href),
  };
}
