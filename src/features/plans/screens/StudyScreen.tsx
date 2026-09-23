import { useState } from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import { Screen } from "@/ui/Screen";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useHideTabBar } from "@/ui/tab-bar/TabBarVisibility";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNav } from "../components/StudyNav";
import { StudyStepBody } from "../components/StudyStepBody";
import { usePlanRouteParams } from "../hooks/use-plan-route-params";
import { useStudyStepTransition } from "../hooks/use-study-step-transition";
import { dayCompleteHref } from "../logic/routes";
import {
  STUDY_STEPS,
  getNextStudyAction,
  getPreviousStudyAction,
  isLastStudyStep,
  type StudyNavAction,
} from "../logic/study-steps";

const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Read, Scripture, Reflect, and Pray as one screen with internal step state.
 * A route per step would unmount the header, tracker, and nav on every
 * change (that was the old horizontal push); here they stay put and only
 * the body cross-fades (`useStudyStepTransition`).
 */
export function StudyScreen() {
  const router = useRouter();
  const { day, plan } = usePlanRouteParams();
  const currentDay = Number(day);
  useHideTabBar();

  const [step, setStep] = useState(0);
  const { renderedStep, bodyStyle } = useStudyStepTransition(step);

  if (!plan) return null;
  const planId = plan.id;

  function applyNavAction(action: StudyNavAction) {
    if (action.type === "exit") router.back();
    else if (action.type === "finish") router.push(dayCompleteHref(planId, currentDay));
    else setStep(action.step);
  }

  const bodyStep = STUDY_STEPS.at(renderedStep) ?? STUDY_STEPS[0];

  return (
    <Screen testID="study-screen" padded style={styles.clearBottomNav}>
      <StudyHeader
        testID="study"
        day={currentDay}
        totalDays={plan.totalDays}
        step={step}
        onBack={() => router.back()}
        // Mocked action only — text-size controls aren't built yet.
        onTextSize={() => undefined}
      />

      <Animated.View style={bodyStyle}>
        <StudyStepBody stepKey={bodyStep.key} />
      </Animated.View>

      <StudyNav
        testID="study-nav"
        step={step}
        {...(isLastStudyStep(step) && { finishLabel: "Finish" })}
        onPrevious={() => applyNavAction(getPreviousStudyAction(step))}
        onNext={() => applyNavAction(getNextStudyAction(step))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  clearBottomNav: { paddingBottom: BOTTOM_NAV_CLEARANCE },
});
