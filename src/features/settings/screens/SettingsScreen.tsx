import { useContext } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { getFloatingNavBarClearance } from "@/ui/organisms/floatingNavBar";
import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
import { SettingsGroup } from "../components/SettingsGroup";
import { useSettingsView } from "../hooks/use-settings-view";
import { MonoBody } from "@/ui/typography/MonoBody";

/**
 * Settings, a tab of its own: the user's routine — daily reminder, Bible
 * translation, text size, each with its value — then about the app, then
 * for churches, each group a card of rows (`SettingsGroup`), and the app's
 * version at the foot.
 */
export function SettingsScreen() {
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const { sections, version, open } = useSettingsView();

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
              if (href) open(href);
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
            {`SundayBest ${version}`}
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
