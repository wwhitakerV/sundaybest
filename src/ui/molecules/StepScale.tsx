import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Minus, Plus, type LucideIcon } from "lucide-react-native";

import { controlHeight, motion, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** The step buttons: a full 44pt target, round. */
const BUTTON = controlHeight.hitTarget;
const ICON_SIZE = 20;
/** − and + drawn firmer than the chrome's icons, so they read as controls at a glance. */
const ICON_STROKE = 3;
/** The scale's line, its ruler marks, and the dot that rides it. */
const LINE = 2;
const TICK = { width: 2, height: 10 } as const;
const DOT = 16;
/** Lands on its step quickly and stops dead — no wobble to follow. */
const DOT_SPRING = { ...motion.snap, reduceMotion: ReduceMotion.System } as const;

export type StepScaleProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** What VoiceOver says for a value, e.g. "2 points larger"; the number when left out. */
  valueText?: (value: number) => string;
  /** What VoiceOver calls the control, e.g. "Text size". */
  accessibilityLabel: string;
  testID: string;
};

/**
 * A size picked along a ruled line, between a small A and a large one: a dot
 * at the current step, a mark for every step, and − and + to move it — each
 * stopping at its end. One adjustable control to VoiceOver.
 */
export function StepScale({
  value,
  min,
  max,
  step,
  onChange,
  valueText,
  accessibilityLabel,
  testID,
}: StepScaleProps) {
  const theme = useTheme();
  const count = Math.round((max - min) / step) + 1;
  const index = Math.round((value - min) / step);
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;
  const [width, setWidth] = useState(0);
  const target = count > 1 ? (index / (count - 1)) * width : 0;

  function decrease() {
    if (canDecrease) onChange(value - step);
  }
  function increase() {
    if (canIncrease) onChange(value + step);
  }

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, ...(valueText && { text: valueText(value) }) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment") increase();
        else if (nativeEvent.actionName === "decrement") decrease();
      }}
      style={styles.row}
    >
      <StepButton
        testID={`${testID}-decrease`}
        icon={Minus}
        enabled={canDecrease}
        onPress={decrease}
      />
      <SFProBody variant="label">A</SFProBody>
      <View
        testID={`${testID}-track`}
        style={styles.track}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width - DOT)}
      >
        <View
          testID={`${testID}-line`}
          style={[styles.line, { backgroundColor: theme.colors.progressTrack }]}
        />
        <View style={styles.ticks}>
          {Array.from({ length: count }, (_, tick) => (
            <View
              key={tick}
              testID={`${testID}-tick-${tick}`}
              style={[styles.tick, { backgroundColor: theme.colors.progressTrack }]}
            />
          ))}
        </View>
        {/* Remade once the track is measured, so it starts in its place. */}
        <ScaleDot key={width > 0 ? "measured" : "unmeasured"} x={target} testID={`${testID}-dot`} />
      </View>
      <SFProTitle variant="headline">A</SFProTitle>
      <StepButton
        testID={`${testID}-increase`}
        icon={Plus}
        enabled={canIncrease}
        onPress={increase}
      />
    </View>
  );
}

/** The scale's dot: in place from the start, then springing from step to step. */
function ScaleDot({ x, testID }: { x: number; testID: string }) {
  const theme = useTheme();
  const position = useSharedValue(x);
  useEffect(() => {
    position.set(withSpring(x, DOT_SPRING));
  }, [position, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() }] }));

  return (
    <Animated.View
      testID={testID}
      style={[styles.dot, { backgroundColor: theme.colors.accent }, style]}
    />
  );
}

function StepButton({
  icon: Icon,
  enabled,
  onPress,
  testID,
}: {
  icon: LucideIcon;
  enabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      disabled={!enabled}
      accessibilityState={{ disabled: !enabled }}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: theme.colors.segmentBackground },
        !enabled && styles.disabled,
      ]}
    >
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[12] },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  track: { flex: 1, height: BUTTON, justifyContent: "center" },
  line: { position: "absolute", left: DOT / 2, right: DOT / 2, height: LINE },
  // Marks sit under the dot's centre at each step, so it lands on one.
  ticks: {
    position: "absolute",
    left: DOT / 2 - TICK.width / 2,
    right: DOT / 2 - TICK.width / 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tick: { width: TICK.width, height: TICK.height },
  dot: { position: "absolute", left: 0, width: DOT, height: DOT, borderRadius: DOT / 2 },
});
