import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Screen } from "@/ui/Screen";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useHideTabBar } from "@/ui/TabBarVisibility";
import { useTheme } from "@/theme";
import { getMockPlan } from "../mock-plans";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNav } from "../components/StudyNav";

const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

const STEP_COUNT = 4;
const OUT_DURATION = 110;
const IN_DURATION = 150;
const REST_TRANSLATE_Y = 0;
const EXIT_TRANSLATE_Y = 8;

function ReadBody() {
  const theme = useTheme();
  return (
    <Text testID="study-read-body" style={[theme.typography.body, { color: theme.colors.text }]}>
      ...
    </Text>
  );
}

function ScriptureBody() {
  const theme = useTheme();
  return (
    <Text
      testID="study-scripture-body"
      style={[theme.typography.body, { color: theme.colors.text }]}
    >
      ...
    </Text>
  );
}

function ReflectBody() {
  const theme = useTheme();
  return (
    <>
      <Text
        testID="study-reflect-body"
        style={[theme.typography.body, { color: theme.colors.text }]}
      >
        ...
      </Text>
    </>
  );
}

function PrayBody() {
  const theme = useTheme();
  return (
    <Text testID="study-pray-body" style={[theme.typography.body, { color: theme.colors.text }]}>
      ...
    </Text>
  );
}

const STEP_BODIES = [ReadBody, ScriptureBody, ReflectBody, PrayBody];

/**
 * Read, Scripture, Reflect, and Pray merged into one screen with internal
 * step state, replacing what used to be four separate `Stack` routes
 * pushed on top of each other. That push/pop navigation is exactly what
 * produced the native horizontal slide between steps; keeping the header,
 * step tracker, and bottom nav genuinely fixed while only the body content
 * transitions requires them to never unmount, which a route change cannot
 * do — hence one screen, not four.
 *
 * The step body cross-fades: the outgoing body fades and drops 8px over
 * 110ms, then (only once that finishes) the content swaps and the
 * incoming body fades up from 8px below over 150ms. Forward and backward
 * navigation always play this same fade-down-out/fade-up-in sequence —
 * neither direction reverses it — and the two bodies are never both at
 * full opacity at once.
 */
export function StudyScreen() {
  const router = useRouter();
  const { planId, day } = useLocalSearchParams<{ planId: string; day: string }>();
  const plan = getMockPlan(planId);
  const currentDay = Number(day);
  useHideTabBar();

  const [step, setStep] = useState(0);
  const [renderedStep, setRenderedStep] = useState(0);
  const progress = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // The completion callback below runs as a worklet on the UI thread, not
    // as an ordinary JS closure — calling `setRenderedStep` directly from
    // it crashes on a real device (Jest's Reanimated mock just invokes the
    // callback synchronously in JS, which is why this shipped without any
    // test catching it). `runOnJS` is what's required to hop back to the
    // JS thread to call a React state setter from inside a worklet; the
    // second `withTiming` reassigns `progress.value` from that same
    // worklet, which is the normal, safe way to chain an animation off a
    // completion callback.
    progress.value = withTiming(0, { duration: OUT_DURATION }, (finished) => {
      if (!finished) return;
      runOnJS(setRenderedStep)(step);
      progress.value = withTiming(1, { duration: IN_DURATION });
    });
  }, [step, progress]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: EXIT_TRANSLATE_Y - progress.value * (EXIT_TRANSLATE_Y - REST_TRANSLATE_Y) },
    ],
  }));

  if (!plan) return null;

  const isFirstStep = step === 0;
  const isLastStep = step === STEP_COUNT - 1;
  const Body = STEP_BODIES[renderedStep] ?? ReadBody;

  return (
    <Screen testID="study-screen" style={styles.content}>
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
        <Body />
      </Animated.View>

      <StudyNav
        testID="study-nav"
        step={step}
        {...(isLastStep && { finishLabel: "Finish" })}
        onPrevious={() => {
          if (isFirstStep) {
            router.back();
            return;
          }
          setStep(step - 1);
        }}
        onNext={() => {
          if (isLastStep) {
            router.push({
              pathname: "/(tabs)/plans/[planId]/day-complete",
              params: { planId: plan.id, day: String(currentDay) },
            });
            return;
          }
          setStep(step + 1);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: BOTTOM_NAV_CLEARANCE, gap: 16 },
});
