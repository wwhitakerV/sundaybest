import { StyleSheet, View } from "react-native";

import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
import { SettingsGroup } from "../components/SettingsGroup";
import { useSettingsView } from "../hooks/use-settings-view";
import { MonoBody } from "@/ui/typography/MonoBody";
import { Button } from "@/ui/atoms/Button";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsSkeleton } from "../components/SettingsSkeleton";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";

/**
 * Settings, a tab of its own: the user's routine — daily reminder, Bible
 * translation, text size, each with its value — then about the app, then
 * for churches, each group a card of rows (`SettingsGroup`), and the app's
 * version at the foot. Its title stays pinned, as Plans' and Progress' do.
 */
export function SettingsScreen() {
  const { sections, version, loading, failed, retry, open } = useSettingsView();

  return (
    <ScrollScreen
      testID="settings-screen"
      header={<TitleHeader title="Settings" />}
      contentStyle={styles.content}
    >
      <SkeletonHandoff
        testID="settings-handoff"
        pending={loading && !sections}
        skeleton={<SettingsSkeleton testID="settings-loading" />}
        style={styles.groups}
      >
        {sections?.map(({ title, rows }) => (
          <SettingsGroup
            key={title}
            title={title}
            rows={rows}
            onOpen={({ href }) => {
              if (href) open(href);
            }}
          />
        ))}
      </SkeletonHandoff>
      {failed && !sections ? (
        <View style={styles.error}>
          <SFProBody tone="textMuted">Couldn’t load your preferences.</SFProBody>
          <Button testID="settings-retry" label="Try again" variant="secondary" onPress={retry} />
        </View>
      ) : null}
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
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  // From the title to the first group, as far as Progress keeps its content from its title.
  content: { gap: space[32], paddingTop: space[8], paddingBottom: FLOATING_NAV_BAR_CLEARANCE },
  groups: { gap: space[32] },
  centred: { textAlign: "center" },
  error: { gap: space[16] },
});
