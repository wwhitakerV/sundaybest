import { Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";
import { SettingsSubpageHeader } from "./SettingsSubpageHeader";

export type SettingsSubpageProps = {
  /** Base testID: the screen is `${testID}-screen`, the header `${testID}`. */
  testID: string;
  title: string;
};

/** The shared shell of every Settings subpage: Back + title, then its body. */
export function SettingsSubpage({ testID, title }: SettingsSubpageProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID={`${testID}-screen`} padded>
      <SettingsSubpageHeader testID={testID} title={title} onBack={() => router.back()} />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>
    </Screen>
  );
}
