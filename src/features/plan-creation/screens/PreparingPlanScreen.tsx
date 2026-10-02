import { Pressable, StyleSheet, View } from "react-native";

import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { ProgressRing } from "@/ui/atoms/ProgressRing";
import { usePreparingPlan } from "../hooks/use-preparing-plan";
import { PreparingStages } from "../components/PreparingStages";
import { getPreparingPercent, getPreparingRows } from "../logic/preparing-stages";
import { controlHeight, space } from "@/theme";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/**
 * Preparing: the plan being built, stage by stage — a ring filling up and a
 * checklist ticking off — a milestone page (`MilestoneScreen`). A failure other than missing captions shows here,
 * with Try again. The build and where it hands on: `usePreparingPlan`.
 */
export function PreparingPlanScreen() {
  const { found, plan, status, failure, retry, close } = usePreparingPlan();

  if (!found) {
    return (
      <NotFoundScreen
        testID="preparing-plan-not-found"
        title="This plan isn't here"
        message="It may have been removed, or the link is out of date."
        actionLabel="Close"
        onAction={close}
      />
    );
  }

  if (failure) {
    return (
      <Screen testID="preparing-plan-screen" padded>
        <View style={styles.centre}>
          <SFProTitle style={styles.centred} accessibilityRole="header">
            We couldn&apos;t finish your plan
          </SFProTitle>
          <SFProBody tone="textMuted" style={styles.centred} testID="preparing-plan-error">
            {failure.message} Nothing&apos;s lost — try again, or come back later.
          </SFProBody>
        </View>
        <View style={styles.actions}>
          <Button testID="preparing-plan-retry-button" label="Try again" onPress={retry} />
          <Button
            testID="preparing-plan-close-button"
            label="Close"
            variant="secondary"
            onPress={close}
          />
        </View>
      </Screen>
    );
  }

  return (
    <MilestoneScreen
      testID="preparing-plan-screen"
      mark={<ProgressRing testID="preparing-plan-progress" percent={getPreparingPercent(status)} />}
      title="Preparing your plan"
      {...(plan?.title && { subtitle: plan.title })}
      footer={
        <View style={[styles.footer, { gap: space[16] }]}>
          <MonoBody variant="supporting" tone="textMuted" style={styles.centred}>
            Takes a few seconds.{"\n"}You can leave this screen.
          </MonoBody>
          <Pressable
            testID="preparing-plan-close-button"
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            style={styles.close}
          >
            <SFProLabel>Close</SFProLabel>
          </Pressable>
        </View>
      }
    >
      {plan && (
        <PreparingStages
          testID="preparing-plan-stages"
          rows={getPreparingRows(status, plan.lengthDays, plan.quickCheckEnabled)}
        />
      )}
    </MilestoneScreen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: space[28] },
  centred: { textAlign: "center" },
  footer: { alignItems: "center" },
  close: {
    minHeight: controlHeight.hitTarget,
    justifyContent: "center",
    paddingHorizontal: space[24],
  },
  actions: { gap: space[12], paddingBottom: space[8] },
});
