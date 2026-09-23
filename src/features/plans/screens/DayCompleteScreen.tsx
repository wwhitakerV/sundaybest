import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { getMockPlan, isPlanComplete } from "../mock-plans";

/** The lowest-numbered day not yet in `completedDays`, or `undefined` if none remain. */
function nextIncompleteDay(totalDays: number, completedDays: number[]): number | undefined {
  const completed = new Set(completedDays);

  for (let day = 1; day <= totalDays; day += 1) {
    if (!completed.has(day)) return day;
  }

  return undefined;
}

export function DayCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();
  const plan = getMockPlan(planId);

  if (!plan) return null;

  // The just-finished day is folded in here for display purposes only — the
  // mock plan itself is read-only, so this does not mutate MOCK_PLANS.
  const completedDays = [...plan.completedDays, Number(day)];
  const nextDay = isPlanComplete({ totalDays: plan.totalDays, completedDays })
    ? undefined
    : nextIncompleteDay(plan.totalDays, completedDays);

  return (
    <Screen testID="day-complete-screen" style={styles.content}>
      <ScreenHeader testID="day-complete" title="Day complete" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="day-complete-quick-check-button"
        label="Take today's quick check"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/plans/[planId]/quick-check/question",
            params: { planId: plan.id, day },
          })
        }
      />

      {nextDay !== undefined && (
        <Button
          testID="day-complete-next-day-button"
          label="Next day"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/(tabs)/plans/[planId]/study",
              params: { planId: plan.id, day: String(nextDay) },
            })
          }
        />
      )}

      <View style={styles.tabActions}>
        <Button
          testID="day-complete-plans-button"
          label="Plans"
          variant="secondary"
          onPress={() => router.push("/(tabs)/plans")}
        />
        <Button
          testID="day-complete-home-button"
          label="Home"
          variant="secondary"
          onPress={() => router.push("/(tabs)/home")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  tabActions: { flexDirection: "row", gap: 12 },
});
