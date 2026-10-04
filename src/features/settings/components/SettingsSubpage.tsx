import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { space } from "@/theme";
import { Screen } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsSubpageHeader } from "./SettingsSubpageHeader";

export type SettingsSubpageProps = {
  /** Base testID: the screen is `${testID}-screen`, the header `${testID}`. */
  testID: string;
  title: string;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/** The shared shell of every Settings subpage: Back + title, then a scrolling body. */
export function SettingsSubpage({ testID, title, children, contentStyle }: SettingsSubpageProps) {
  const router = useRouter();

  return (
    <Screen testID={`${testID}-screen`} padded>
      <SettingsSubpageHeader testID={testID} title={title} onBack={() => router.back()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentStyle]}
      >
        {children ?? <SFProBody>...</SFProBody>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[24], paddingBottom: space[32] },
});
