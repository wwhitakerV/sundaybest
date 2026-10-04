import { Alert, StyleSheet, View } from "react-native";

import { useUpdateSettingsMutation, useUserSettingsQuery } from "@/core/api/queries";
import { radius, space, useTheme } from "@/theme";
import type { TextSize } from "@/types/domain";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsChoiceList, type SettingsChoice } from "../components/SettingsChoiceList";
import { SettingsSubpage } from "../components/SettingsSubpage";

const SIZES: readonly SettingsChoice<TextSize>[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "extraLarge", label: "Extra large" },
];

export function TextSizeScreen() {
  const theme = useTheme();
  const settingsQuery = useUserSettingsQuery();
  const update = useUpdateSettingsMutation();
  const value = settingsQuery.data?.settings.textSize ?? "default";

  function select(next: TextSize) {
    if (next === value || update.isPending) return;
    update.mutate(
      { textSize: next },
      {
        onError: () => Alert.alert("Couldn’t update text size", "Try again in a moment."),
      },
    );
  }

  return (
    <SettingsSubpage testID="text-size" title="Text size">
      <View
        testID="text-size-preview"
        style={[
          styles.preview,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.containerBorder,
            borderRadius: radius[24],
            gap: space[8],
          },
        ]}
      >
        <SFProBody variant="label" tone="textMuted">
          PREVIEW
        </SFProBody>
        <SFProBody variant="reading">
          Your word is a lamp for my feet, a light on my path.
        </SFProBody>
      </View>
      <SettingsChoiceList
        testID="text-size-options"
        choices={SIZES}
        value={value}
        onChange={select}
        disabled={settingsQuery.isPending}
      />
      <SFProBody variant="detail" tone="textMuted">
        This changes text throughout SundayBest. Daily Study also keeps its separate reading-size control.
      </SFProBody>
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: 1, padding: space[20] },
});
