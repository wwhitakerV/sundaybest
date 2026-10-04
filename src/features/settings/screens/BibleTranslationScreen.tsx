import { Alert } from "react-native";

import { useUpdateSettingsMutation, useUserSettingsQuery } from "@/core/api/queries";
import type { BibleTranslation } from "@/types/domain";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsChoiceList, type SettingsChoice } from "../components/SettingsChoiceList";
import { SettingsSubpage } from "../components/SettingsSubpage";

const TRANSLATIONS: readonly SettingsChoice<BibleTranslation>[] = [
  { value: "NIV", label: "NIV", detail: "New International Version" },
  { value: "ESV", label: "ESV", detail: "English Standard Version" },
  { value: "KJV", label: "KJV", detail: "King James Version" },
  { value: "NLT", label: "NLT", detail: "New Living Translation" },
  { value: "BSB", label: "BSB", detail: "Berean Standard Bible" },
];

export function BibleTranslationScreen() {
  const settingsQuery = useUserSettingsQuery();
  const update = useUpdateSettingsMutation();
  const value = settingsQuery.data?.settings.bibleTranslation ?? "NIV";

  function select(next: BibleTranslation) {
    if (next === value || update.isPending) return;
    update.mutate(
      { bibleTranslation: next },
      {
        onError: () => {
          Alert.alert("Couldn’t update translation", "Try again in a moment.");
        },
      },
    );
  }

  return (
    <SettingsSubpage testID="bible-translation" title="Bible translation">
      <SFProBody tone="textMuted">
        Scripture in your plans will use this translation whenever that text is available.
      </SFProBody>
      <SettingsChoiceList
        testID="bible-translation-options"
        choices={TRANSLATIONS}
        value={value}
        onChange={select}
        disabled={settingsQuery.isPending}
      />
    </SettingsSubpage>
  );
}
