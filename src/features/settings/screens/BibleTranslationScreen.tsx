import { Alert } from "react-native";

import { useUpdateSettingsMutation, useUserSettingsQuery } from "@/core/api/reader-queries";
import type { BibleTranslation } from "@/types/domain";
import { SettingsChoiceList } from "../components/SettingsChoiceList";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { BIBLE_TRANSLATION_CHOICES, DEFAULT_BIBLE_TRANSLATION } from "../logic/bible-translations";

export function BibleTranslationScreen() {
  const settingsQuery = useUserSettingsQuery();
  const update = useUpdateSettingsMutation();
  const value = settingsQuery.data?.settings.bibleTranslation ?? DEFAULT_BIBLE_TRANSLATION;

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
    <SettingsSubpage
      testID="bible-translation"
      title="Bible translation"
      footnote="Scripture in your plans will use this translation whenever that text is available."
    >
      <SettingsChoiceList
        testID="bible-translation-options"
        choices={BIBLE_TRANSLATION_CHOICES}
        value={value}
        onChange={select}
        disabled={settingsQuery.isPending}
      />
    </SettingsSubpage>
  );
}
