import { Text } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { TitleHeader } from "@/ui/TitleHeader";
import { useTheme } from "@/theme";

/** A plain shell only — no design or real content yet. */
export function FunScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="fun-screen" padded>
      <TitleHeader
        title="Fun"
        actions={
          <HeaderIconButton
            testID="fun-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        }
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>
    </Screen>
  );
}
