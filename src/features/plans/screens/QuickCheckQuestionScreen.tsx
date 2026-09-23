import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { QuickCheckHeader } from "../components/QuickCheckHeader";

const PLACEHOLDER_OPTIONS = ["A", "B", "C"] as const;

export function QuickCheckQuestionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();

  return (
    <Screen testID="quick-check-question-screen" style={styles.content}>
      <QuickCheckHeader
        testID="quick-check-question"
        step={1}
        onClose={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/day-complete",
            params: { planId, day },
          })
        }
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <View style={styles.options}>
        {PLACEHOLDER_OPTIONS.map((option) => (
          <Pressable
            key={option}
            testID={`quick-check-question-option-${option}`}
            accessibilityRole="button"
            style={[styles.option, { borderColor: theme.colors.divider }]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>{option}</Text>
          </Pressable>
        ))}
      </View>

      <Button
        testID="quick-check-question-check-answer-button"
        label="Check answer"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/quick-check/answer",
            params: { planId, day },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  options: { gap: 8 },
  option: { padding: 12, borderWidth: 1, borderRadius: 8 },
});
