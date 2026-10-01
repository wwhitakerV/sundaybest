import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flame } from "lucide-react-native";

import type { LocalTime } from "@/types/domain";
import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { space, useTheme } from "@/theme";
import { useModalSession } from "@/hooks/use-modal-session";
import { SAMPLE_PLAN_ID, studyHref } from "@/features/plans";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";
import { getPlanById, getReminder, useAppSelector, useStoreActions } from "@/core/store";
import { ReminderTimes } from "../components/ReminderTimes";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

const ICON_RING = 160;

/**
 * Plan Ready: the plan just built, how long it runs and what it's from, a
 * morning reminder to pick, then Start day 1 (which starts the plan) or Not
 * now (it waits in Your plans).
 */
export function PlanReadyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plan = useAppSelector((state) => (planId ? getPlanById(state, planId) : null));
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const { startPlan, updateReminderEnabled, updateReminderTime } = useStoreActions();

  function onSelectTime(time: LocalTime) {
    if (!reminder) return;
    updateReminderEnabled(reminder.id, true);
    updateReminderTime(reminder.id, time);
  }

  async function handleStart() {
    if (plan) startPlan(plan.id);
    await requestNotificationPermission();
    // Replace, not push: the new-plan modal hands off to the study session
    // modal rather than stacking one modal on top of the other.
    router.replace(studyHref(plan?.id ?? SAMPLE_PLAN_ID, 1));
  }

  return (
    <Screen testID="plan-ready-screen" padded>
      <View style={styles.centre}>
        <View style={[styles.ring, { borderColor: theme.colors.segmentBackground }]}>
          <Flame size={56} color={theme.colors.accent} strokeWidth={theme.icon.strokeWidth} />
        </View>
        <View style={styles.titles}>
          <DisplayTitle style={styles.centred} testID="plan-ready-title" accessibilityRole="header">
            Your plan is ready
          </DisplayTitle>
          {plan && (
            <SFProBody tone="textMuted" style={styles.centred} testID="plan-ready-summary">
              {plan.lengthDays} {plan.lengthDays === 1 ? "day" : "days"} from {plan.title}
            </SFProBody>
          )}
        </View>
        <ReminderTimes
          testID="plan-ready-reminder"
          selected={reminder?.enabled ? reminder.time : null}
          onSelect={onSelectTime}
        />
      </View>

      <View style={styles.actions}>
        <Button
          testID="plan-ready-start-button"
          label="Start day 1"
          onPress={() => void handleStart()}
        />
        <Button
          testID="plan-ready-not-now-button"
          label="Not now"
          variant="secondary"
          onPress={() => session.exitTo("/(tabs)/home")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: space[28] },
  ring: {
    width: ICON_RING,
    height: ICON_RING,
    borderRadius: ICON_RING / 2,
    borderWidth: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { alignItems: "center", gap: space[8] },
  centred: { textAlign: "center" },
  actions: { gap: space[12], paddingBottom: space[8] },
});
