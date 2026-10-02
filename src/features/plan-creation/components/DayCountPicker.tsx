import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { PlanLength } from "@/types/domain";
import { controlHeight, motion, radius, space, useTheme } from "@/theme";
import { formatPlanLength, getPlanEndsLine } from "@/entities/plan";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const LENGTHS: readonly PlanLength[] = [1, 2, 3, 4, 5, 6, 7];
/** A chip: 44pt wide keeps it a full tap target. */
const CHIP = { width: controlHeight.hitTarget, height: 57 } as const;
/** The outline round the length picked — as heavy as it was on the chip itself. */
const OUTLINE = 2.5;
/** Every selection outline in the app moves on the same spring. */
const SLIDE = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type DayCountPickerProps = {
  value: PlanLength;
  onChange: (days: PlanLength) => void;
  testID: string;
};

/**
 * "How many days?": one chip per length, 1 to 7, each edged the same, and
 * when that plan would end. The length picked is outlined in black — one
 * outline, drawn once the chips are measured, that slides to each length
 * picked, as Plan Detail's day outline does.
 */
export function DayCountPicker({ value, onChange, testID }: DayCountPickerProps) {
  const theme = useTheme();
  const [positions, setPositions] = useState<ReadonlyMap<PlanLength, number>>(new Map());
  const picked = positions.get(value);

  return (
    <View testID={testID} style={styles.wrap}>
      <SFProBody tone="textMuted" style={styles.heading}>
        How many days?
      </SFProBody>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LENGTHS.map((days) => (
          <Pressable
            key={days}
            testID={`${testID}-${days}`}
            accessibilityRole="radio"
            accessibilityLabel={formatPlanLength(days)}
            accessibilityState={{ selected: days === value }}
            onLayout={({ nativeEvent: { layout } }) =>
              setPositions((current) => new Map(current).set(days, layout.x))
            }
            onPress={() => onChange(days)}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          >
            <SFProTitle variant="headlineRegular">{days}</SFProTitle>
          </Pressable>
        ))}
        {picked !== undefined && <Outline x={picked} testID={`${testID}-outline`} />}
      </View>
      <MonoBody variant="supporting" tone="textMuted">
        {getPlanEndsLine(value)}
      </MonoBody>
    </View>
  );
}

/** The outline round the length picked: in place from the start, then sliding to each new one. */
function Outline({ x, testID }: { x: number; testID: string }) {
  const theme = useTheme();
  const position = useSharedValue(x);
  useEffect(() => {
    position.set(withSpring(x, SLIDE));
  }, [x, position]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() }] }));

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[styles.outline, { borderColor: theme.colors.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[12] },
  heading: { marginLeft: space[6] },
  chips: { flexDirection: "row", justifyContent: "space-between" },
  chip: {
    width: CHIP.width,
    height: CHIP.height,
    borderRadius: radius[14],
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Over the chips, placed along the row by its slide (`translateX`).
  outline: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CHIP.width,
    height: CHIP.height,
    borderRadius: radius[14],
    borderWidth: OUTLINE,
  },
});
