import { useContext } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { getFloatingNavBarClearance } from "@/ui/organisms/floatingNavBar";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
import { getAppVersion } from "@/core/config/app-version";
import { getReminder, getUserSettings, useAppSelector } from "@/core/store";
import { SettingsGroup } from "../components/SettingsGroup";
import { describeSettingsSections, formatShortVersion } from "../logic/settings-sections";
import { MonoBody } from "@/ui/typography/MonoBody";

/**
 * Settings, a tab of its own: the user's routine — daily reminder, Bible
 * translation, text size, each with its value — then about the app, then
 * for churches, each group a card of rows (`SettingsGroup`), and the app's
 * version at the foot.
 */
export function SettingsScreen() {
  const router = useRouter();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const settings = useAppSelector(getUserSettings);
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const version = getAppVersion();
  const sections = describeSettingsSections({
    reminderTime: reminder?.enabled ? reminder.time : null,
    translation: settings.bibleTranslation,
    textSize: settings.textSize,
  });

  return (
    <Screen testID="settings-screen" padded="vertical">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inset,
          {
            gap: space[32],
            paddingBottom: getFloatingNavBarClearance(insetBottom) + space[24],
          },
        ]}
      >
        <TitleHeader title="Settings" />
        {sections.map(({ title, rows }) => (
          <SettingsGroup
            key={title}
            title={title}
            rows={rows}
            onOpen={({ href }) => {
              if (href) router.push(href);
            }}
          />
        ))}
        {version && (
          <MonoBody
            variant="supporting"
            tone="textMuted"
            style={styles.centred}
            testID="settings-version"
          >
            {`SundayBest ${formatShortVersion(version)}`}
          </MonoBody>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  centred: { textAlign: "center" },
});
