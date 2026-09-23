import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { QuickCheckHeader } from "../components/QuickCheckHeader";

export function QuickCheckAnswerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();

  return (
    <Screen testID="quick-check-answer-screen" style={styles.content}>
      <QuickCheckHeader
        testID="quick-check-answer"
        step={1}
        onClose={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/day-complete",
            params: { planId, day },
          })
        }
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="quick-check-answer-next-question-button"
        label="Next question"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/quick-check/finish-verse",
            params: { planId, day },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
