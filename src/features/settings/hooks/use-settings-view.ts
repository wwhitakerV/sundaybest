import { useRouter } from "expo-router";

import { getAppVersion } from "@/core/config/app-version";
import { getReminder, getUserSettings, useAppSelector } from "@/core/store";
import {
  describeSettingsSections,
  formatShortVersion,
  type SettingsRow,
} from "../logic/settings-sections";

/** Settings' view model: its sections and rows from the store, the app's version, and where a row goes. */
export function useSettingsView() {
  const router = useRouter();
  const settings = useAppSelector(getUserSettings);
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const version = getAppVersion();

  return {
    sections: describeSettingsSections({
      reminderTime: reminder?.enabled ? reminder.time : null,
      translation: settings.bibleTranslation,
      textSize: settings.textSize,
    }),
    version: version ? formatShortVersion(version) : null,
    open: (href: NonNullable<SettingsRow["href"]>) => router.push(href),
  };
}
