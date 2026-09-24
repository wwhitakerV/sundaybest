import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { getPlanProgress, useAppSelector } from "@/core/store";
import { useStudyRoute } from "../hooks/use-study-route";
import { useModalSession } from "@/hooks/use-modal-session";
import { getNextDayToStudy } from "../logic/next-day";
import { quickCheckHref, studyHref } from "../logic/routes";

/**
 * Where the Daily Study session lands after Finish. Quick Check pushes on top
 * of it inside the session; Next day swaps it for the next day's study;
 * Plans and Home leave the session entirely. The next day is read from the
 * store's progress, which finishing the day has already moved on.
 */
export function DayCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();
  const { planId, dayNumber } = useStudyRoute();
  const progress = useAppSelector((state) => getPlanProgress(state, planId));

  if (!progress) return null;

  const nextDay = getNextDayToStudy(progress, dayNumber);

  return (
    <Screen testID="day-complete-screen" padded>
      <ScreenHeader testID="day-complete" title="Day complete" />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="day-complete-quick-check-button"
        label="Take today's quick check"
        onPress={() => router.push(quickCheckHref(planId, dayNumber))}
      />

      {nextDay !== undefined && (
        <Button
          testID="day-complete-next-day-button"
          label="Next day"
          variant="secondary"
          onPress={() => router.replace(studyHref(planId, nextDay))}
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
