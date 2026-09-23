import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { useModalSession } from "@/hooks/use-modal-session";
import { getNextDayAfterCompleting } from "../logic/plan-progress";
import { quickCheckHref, studyHref } from "../logic/routes";

/**
 * Where the Daily Study session lands after Finish. Quick Check pushes on top
 * of it inside the session; Next day swaps it for the next day's study;
 * Plans and Home leave the session entirely.
 */
export function DayCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();
  const { day, plan } = usePlanRouteParams();

  if (!plan) return null;

  const nextDay = getNextDayAfterCompleting(plan, Number(day));

  return (
    <Screen testID="day-complete-screen" padded>
      <ScreenHeader testID="day-complete" title="Day complete" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="day-complete-quick-check-button"
        label="Take today's quick check"
        onPress={() => router.push(quickCheckHref(plan.id, day))}
      />

      {nextDay !== undefined && (
        <Button
          testID="day-complete-next-day-button"
          label="Next day"
          variant="secondary"
          onPress={() => router.replace(studyHref(plan.id, nextDay))}
        />
      )}

      <View style={styles.tabActions}>
        <Button
          testID="day-complete-plans-button"
          label="Plans"
          variant="secondary"
          onPress={() => session.exitTo("/(tabs)/plans")}
        />
        <Button
          testID="day-complete-home-button"
          label="Home"
          variant="secondary"
          onPress={() => session.exitTo("/(tabs)/home")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabActions: { flexDirection: "row", gap: 12 },
});
