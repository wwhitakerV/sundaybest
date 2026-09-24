import { useState } from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { QuickCheckHeader } from "../components/QuickCheckHeader";
import { QuickCheckStageBody } from "../components/QuickCheckStageBody";
import { useStudyRoute } from "../hooks/use-study-route";
import { useStepTransition } from "@/hooks/use-step-transition";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { QUICK_CHECK_STAGES, getNextQuickCheckAction } from "../logic/quick-check-stages";
import { dayCompleteHref } from "../logic/routes";

/**
 * Question, Answer, Finish the verse, and Score as one screen with internal
 * stage state — the same pattern as `StudyScreen`. The header, tracker, and
 * action button stay put; only the body cross-fades (`useStepTransition`), so
 * nothing slides sideways mid-quiz.
 *
 * Pushed on top of Day Complete inside the Daily Study session. Close and
 * Done both return there.
 */
export function QuickCheckScreen() {
  const router = useRouter();
  const { planId, dayNumber } = useStudyRoute();

  const [stage, setStage] = useState(0);
  const reduceMotion = useReduceMotion();
  // Calm, like the study it follows.
  const { renderedStep, bodyStyle } = useStepTransition(stage, { profile: "calm", reduceMotion });

  const currentStage = QUICK_CHECK_STAGES.at(stage) ?? QUICK_CHECK_STAGES[0];
  const bodyStage = QUICK_CHECK_STAGES.at(renderedStep) ?? QUICK_CHECK_STAGES[0];

  function backToDayComplete() {
    router.dismissTo(dayCompleteHref(planId, dayNumber));
  }

  function next() {
    const action = getNextQuickCheckAction(stage);
    if (action.type === "done") backToDayComplete();
    else setStage(action.stage);
  }

  return (
    <Screen testID="quick-check-screen" padded>
      <QuickCheckHeader
        testID="quick-check"
        counter={currentStage.counter}
        progressIndex={currentStage.progressIndex}
        onClose={backToDayComplete}
      />

      <Animated.View style={[styles.body, bodyStyle]}>
        <QuickCheckStageBody stage={bodyStage} />
      </Animated.View>

      <Button testID={currentStage.actionTestID} label={currentStage.actionLabel} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Fills the space between header and action, so the button stays anchored
  // at the bottom whatever the stage's body height.
  body: { flex: 1 },
});
