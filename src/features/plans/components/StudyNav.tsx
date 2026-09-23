import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { DotPagination } from "@/ui/DotPagination";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { sparkBuzz } from "@/core/haptics/haptics";
import { SparkBurst } from "./SparkBurst";

const { capsuleHeight, capsuleRadius, sideMargin, bottomMargin } = FLOATING_NAV_BAR;
const STUDY_STEPS = 4;
const ARROW_ICON_SIZE = 20;
const ARROW_STROKE_WIDTH = 2;
const TROPHY_ICON_SIZE = 18;
const TROPHY_STROKE_WIDTH = 2;

const ENTRANCE_RISE_DISTANCE = 12;
const ENTRANCE_START_SCALE = 0.98;
const ENTRANCE_FADE_DURATION = 180;
const ENTRANCE_RISE_DURATION = 320;
// `Easing.back` overshoots past 1 before settling — a small `s` keeps that
// overshoot restrained rather than bouncy. Driven by `withTiming`, not
// `withSpring`: this codebase's one other completion-callback + `runOnJS`
// entrance (`StudyScreen`'s step cross-fade) already uses `withTiming` and
// is confirmed working on-device, whereas a `withSpring` completion
// callback was a genuinely untested combination here and never fired.
const ENTRANCE_RISE_EASING = Easing.back(1.2);
// Sparks and haptic land 200ms after the rise animation's own completion
// callback fires, not at the overshoot itself — simpler to reason about
// and tune than inferring the exact moment the curve peaks.
const SPARK_DELAY_AFTER_SPRING_MS = 200;

export type StudyNavProps = {
  /** 0-indexed position in Read/Scripture/Reflect/Pray. */
  step: number;
  onPrevious: () => void;
  onNext: () => void;
  /** Pray's ending action: replaces the forward arrow with a black
   * trophy + label (e.g. "Finish") instead of stepping to another study
   * screen. Omit for the plain forward-arrow behaviour. */
  finishLabel?: string;
  testID?: string;
};

/**
 * The fixed-to-the-bottom step pager shared by Read, Scripture, Reflect,
 * and Pray — the same floating capsule chrome as the main tab bar
 * (`FLOATING_NAV_BAR`), replacing each study screen's inline
 * Previous/Next buttons. The dots track the 4-step study flow itself.
 *
 * Plays a one-time entrance animation on mount — this component is
 * created once per Daily Study session (Read/Scripture/Reflect/Pray are
 * one screen with internal step state, not four separate routes, so
 * `StudyNav` is never unmounted/remounted by a step change) — fading in
 * while rising from 12px below and scaling from 0.98 to 1, with a small,
 * restrained overshoot from `Easing.back`. 200ms after that rise
 * animation's own completion callback fires, a small red spark burst
 * (`SparkBurst`) plays around the capsule alongside a single continuous
 * ~400ms haptic buzz (`sparkBuzz`).
 */
export function StudyNav({ step, onPrevious, onNext, finishLabel, testID }: StudyNavProps) {
  const theme = useTheme();
  const [showSparks, setShowSparks] = useState(false);
  // Both start at their settled values (1), not 0: under Jest's Reanimated
  // mock, `useAnimatedStyle` evaluates its worklet exactly once,
  // synchronously, during the render that calls it — the very first one,
  // before the effect below ever runs — and the mock's shared values
  // don't trigger a re-render on mutation, so whatever `useAnimatedStyle`
  // captures on that first pass is what every test (and any render before
  // the animation settles) sees, permanently. Initializing at 1 keeps
  // that frozen snapshot fully visible; the effect below drops both to 0
  // and animates them back up, which is a real animation on-device
  // (Reanimated's real runtime *is* reactive), but is a same-frame no-op
  // under the mock.
  //
  // Two separate shared values, not one: the fade (180ms `withTiming`) and
  // the rise/scale (a slower `withSpring`) run on different curves and
  // different durations at the same time — driving both from one value
  // would let the second assignment simply pre-empt the first.
  const opacity = useSharedValue(1);
  const rise = useSharedValue(1);
  const sparkTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function scheduleSparkBurst() {
      sparkTimeoutRef.current = setTimeout(() => {
        setShowSparks(true);
        sparkBuzz();
      }, SPARK_DELAY_AFTER_SPRING_MS);
    }

    opacity.value = 0;
    rise.value = 0;
    opacity.value = withTiming(1, { duration: ENTRANCE_FADE_DURATION });
    rise.value = withTiming(
      1,
      { duration: ENTRANCE_RISE_DURATION, easing: ENTRANCE_RISE_EASING },
      (finished) => {
        if (!finished) return;
        runOnJS(scheduleSparkBurst)();
      },
    );

    return () => clearTimeout(sparkTimeoutRef.current);
  }, [opacity, rise]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: (1 - rise.value) * ENTRANCE_RISE_DISTANCE },
      { scale: ENTRANCE_START_SCALE + (1 - ENTRANCE_START_SCALE) * rise.value },
    ],
  }));

  return (
    <Animated.View
      testID={testID}
      style={[styles.wrapper, { paddingBottom: bottomMargin }, entranceStyle]}
    >
      <SparkBurst {...(testID && { testID: `${testID}-sparks` })} fire={showSparks} />
      <View
        style={[
          styles.capsule,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
        ]}
      >
        <Pressable
          testID={testID && `${testID}-prev-button`}
          accessibilityRole="button"
          accessibilityLabel="Previous"
          onPress={onPrevious}
          style={styles.side}
        >
          <ArrowLeft
            size={ARROW_ICON_SIZE}
            color={theme.colors.chromeIcon}
            strokeWidth={ARROW_STROKE_WIDTH}
          />
          <Text style={[theme.typography.label, { color: theme.colors.text }]}>Previous</Text>
        </Pressable>

        <DotPagination
          {...(testID && { testID: `${testID}-dots` })}
          count={STUDY_STEPS}
          activeIndex={step}
          variant="pill"
        />

        <Pressable
          testID={testID && `${testID}-next-button`}
          accessibilityRole="button"
          accessibilityLabel={finishLabel ?? "Next"}
          onPress={onNext}
          style={styles.side}
        >
          {finishLabel ? (
            <>
              <Text style={[theme.typography.label, { color: theme.colors.text }]}>
                {finishLabel}
              </Text>
              <Trophy
                size={TROPHY_ICON_SIZE}
                color={theme.colors.text}
                strokeWidth={TROPHY_STROKE_WIDTH}
              />
            </>
          ) : (
            <>
              <Text style={[theme.typography.label, { color: theme.colors.text }]}>Next</Text>
              <ArrowRight
                size={ARROW_ICON_SIZE}
                color={theme.colors.chromeIcon}
                strokeWidth={ARROW_STROKE_WIDTH}
              />
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: sideMargin,
    right: sideMargin,
    bottom: 0,
  },
  capsule: {
    height: capsuleHeight,
    borderRadius: capsuleRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
