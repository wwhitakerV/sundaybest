import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { useModalSession } from "@/hooks/use-modal-session";
import { useStepTransition } from "@/hooks/use-step-transition";
import { PlanCreationHeader } from "../components/PlanCreationHeader";
import {
  NEW_PLAN_STEPS,
  getNewPlanLeadingAction,
  getNextNewPlanAction,
} from "../logic/new-plan-steps";

/**
 * Paste Sermon and Link Preview as one screen with internal step state — the
 * same pattern as Daily Study and Quick Check. The header and action stay put;
 * only the body cross-fades (`useStepTransition`), so the steps never slide.
 *
 * The first screen of the New Plan full-screen modal (`src/app/(plan-creation)`).
 * X on the first step dismisses the whole modal; Back on the second steps back.
 */
export function NewPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();

  const [step, setStep] = useState(0);
  const { renderedStep, bodyStyle } = useStepTransition(step);

  const current = NEW_PLAN_STEPS.at(step) ?? NEW_PLAN_STEPS[0];
  const body = NEW_PLAN_STEPS.at(renderedStep) ?? NEW_PLAN_STEPS[0];

  function onLeading() {
    const action = getNewPlanLeadingAction(step);
    if (action.type === "exit") session.exit();
    else setStep(action.step);
  }

  function onNext() {
    const action = getNextNewPlanAction(step);
    if (action.type === "create") router.push("/(plan-creation)/preparing");
    else setStep(action.step);
  }

  return (
    <Screen testID="new-plan-screen" padded>
      <PlanCreationHeader
        testID={current.key}
        leading={current.leading}
        step={current.counter}
        onPress={onLeading}
      />

      <Animated.View style={bodyStyle}>
        <Text
          testID={`${body.key}-body`}
          style={[theme.typography.body, { color: theme.colors.text }]}
        >
          ...
        </Text>
      </Animated.View>

      <Button testID={current.actionTestID} label={current.actionLabel} onPress={onNext} />
    </Screen>
  );
}
