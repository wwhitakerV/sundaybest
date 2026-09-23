import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

/**
 * No real sermon processing happens here — "Continue" is a temporary
 * navigation control standing in for the moment processing would finish, so
 * the flow can be clicked through end to end. The "can't make this video" /
 * missing-caption path is explicitly out of scope for this build.
 */
export function PreparingPlanScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="preparing-plan-screen" padded>
      <Pressable
        testID="preparing-plan-close-button"
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
      >
        <X size={24} color={theme.colors.text} />
      </Pressable>

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="preparing-plan-continue-button"
        label="Continue"
        onPress={() => router.push("/(plan-creation)/ready")}
      />
    </Screen>
  );
}
