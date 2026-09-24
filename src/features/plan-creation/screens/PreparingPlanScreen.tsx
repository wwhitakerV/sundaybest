import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  getPlanById,
  getPlanGeneration,
  isGeneratingPlan,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { ProgressRing } from "@/ui/ProgressRing";
import { PreparingStages } from "../components/PreparingStages";
import { getPreparingPercent, getPreparingRows } from "../logic/preparing-stages";

/**
 * Preparing: the plan being built, stage by stage — a ring filling up and a
 * checklist ticking off — as the store's build moves on. The build runs
 * app-wide, so Close only leaves the screen; the plan is still made.
 *
 * When the build finishes it moves on to Plan Ready. If the video has no
 * captions it goes back to New Plan, which explains. Any other failure shows
 * here, with Try again restarting the build.
 */
export function PreparingPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();
  const { planId = "" } = useLocalSearchParams<{ planId: string }>();
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const busy = useAppSelector(isGeneratingPlan);
  const storeGeneration = useAppSelector(getPlanGeneration);
  const generation = storeGeneration?.planId === planId ? storeGeneration : null;
  const { startPlanGeneration, retryPlanGeneration } = useStoreActions();

  const status = generation?.status ?? "idle";
  const failure = status === "failed" ? generation?.error : null;
  const noCaptions = failure?.code === "noCaptions";

  // A draft whose build hasn't started yet — another plan was being built
  // when it was made — starts as soon as the builder is free.
  useEffect(() => {
    if (plan?.status === "draft" && !generation && !busy) startPlanGeneration(plan.id);
  }, [plan, generation, busy, startPlanGeneration]);

  useEffect(() => {
    if (status === "completed") {
      router.replace({ pathname: "/(plan-creation)/ready", params: { planId } });
    } else if (noCaptions) {
      router.back();
    }
  }, [status, noCaptions, planId, router]);

  if (failure && !noCaptions) {
    return (
      <Screen testID="preparing-plan-screen" padded>
        <View style={styles.centre}>
          <Text
            accessibilityRole="header"
            style={[theme.typography.screenTitle, styles.centred, { color: theme.colors.text }]}
          >
            We couldn&apos;t finish your plan
          </Text>
          <Text
            testID="preparing-plan-error"
            style={[theme.typography.body, styles.centred, { color: theme.colors.textMuted }]}
          >
            {failure.message} Nothing&apos;s lost — try again, or come back later.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            testID="preparing-plan-retry-button"
            label="Try again"
            onPress={retryPlanGeneration}
          />
          <Button
            testID="preparing-plan-close-button"
            label="Close"
            variant="secondary"
            onPress={session.exit}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="preparing-plan-screen" padded>
      <View style={styles.centre}>
        <ProgressRing testID="preparing-plan-progress" percent={getPreparingPercent(status)} />
        <View style={styles.titles}>
          <Text
            accessibilityRole="header"
            style={[theme.typography.screenTitle, styles.centred, { color: theme.colors.text }]}
          >
            Preparing your plan
          </Text>
          {plan?.title ? (
            <Text
              style={[theme.typography.body, styles.centred, { color: theme.colors.textMuted }]}
            >
              {plan.title}
            </Text>
          ) : null}
        </View>
        {plan && (
          <PreparingStages
            testID="preparing-plan-stages"
            rows={getPreparingRows(status, plan.lengthDays, plan.quickCheckEnabled)}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text
          style={[theme.typography.supporting, styles.centred, { color: theme.colors.textMuted }]}
        >
          Takes a few seconds.{"\n"}You can leave this screen.
        </Text>
        <Pressable
          testID="preparing-plan-close-button"
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={session.exit}
          style={styles.close}
        >
          <Text style={[theme.typography.button, { color: theme.colors.text }]}>Close</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  titles: { alignItems: "center", gap: 8 },
  centred: { textAlign: "center" },
  footer: { alignItems: "center", gap: 16, paddingBottom: 8 },
  close: { minHeight: 44, justifyContent: "center", paddingHorizontal: 24 },
  actions: { gap: 12, paddingBottom: 8 },
});
