import { Alert, StyleSheet, View } from "react-native";

import { useUpdateSettingsMutation, useUserSettingsQuery } from "@/core/api/reader-queries";
import { radius, space, useTheme } from "@/theme";
import type { TextSize } from "@/types/domain";
import { PassageCard, PassageHeading } from "@/entities/scripture";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";
import { SettingsChoiceList, type SettingsChoice } from "../components/SettingsChoiceList";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { DEFAULT_BIBLE_TRANSLATION } from "../logic/bible-translations";
import { previewPassage } from "../logic/text-size-preview";

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
  const passage = previewPassage(
    settingsQuery.data?.settings.bibleTranslation ?? DEFAULT_BIBLE_TRANSLATION,
  );

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
    <SettingsSubpage
      testID="text-size"
      title="Text size"
      footnote="This changes text throughout SundayBest. Daily Study also keeps its separate reading-size control."
    >
      <View
        testID="text-size-preview"
        style={[
          styles.preview,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radius[24],
            gap: space[12],
          },
        ]}
      >
        <SFProBody variant="label" tone="textMuted">
          PREVIEW
        </SFProBody>
        {/* As the Daily Study sets Scripture — its heading, then the verse — set straight on the preview's grey. */}
        <PassageHeading reference={passage.reference} translation={passage.translation} onSurface />
        <PassageCard testID="text-size-preview-verse" bare>
          <Span>
            <MonoLabel variant="emphasis">{`${passage.verse} `}</MonoLabel>
            {passage.text}
          </Span>
        </PassageCard>
      </View>
      <SettingsChoiceList
        testID="text-size-options"
        choices={SIZES}
        value={value}
        onChange={select}
        disabled={settingsQuery.isPending}
      />
    </SettingsSubpage>
  );
}

const styles = StyleSheet.create({
  preview: { padding: space[20] },
});
