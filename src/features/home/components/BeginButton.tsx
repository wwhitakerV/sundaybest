import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { typingFeedback } from "@/core/haptics/haptics";
import { controlHeight, motion, radius, space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { useRiseIn } from "../hooks/use-rise-in";
import { PUNCH_AT } from "../logic/welcome-timing";

/**
 * The pill's second, inner rule: this far inside its edge, and finer than a
 * point — a printed rule, no heavier than the rest of the interface, still
 * clearly there.
 */
const RULE_INSET = 3;
const RULE_WIDTH = 0.6;
const PILL_RADIUS = radius[32];
/** How quickly the words come up as they punch in: all but instantly. */
const PUNCH_FADE_MS = 90;

const { welcome } = motion;

export type BeginButtonProps = {
  label: string;
  onPress: () => void;
  /** Its turn in the welcome: it assembles. */
  assembled: boolean;
  /** Already in place: no assembling (Reduce Motion, or the welcome played). */
  instant: boolean;
  testID: string;
};

/**
 * The one way in before there's a plan: the primary pill, drawn with a second
 * fine rule just inside its edge, its words centred. Its turn come, the empty
 * pill fades in as it rises, and a breath after it's settled its words punch
 * up into place from smaller, spring back past full, and land with one soft
 * tick. It can be pressed as soon as the pill is
 * there.
 */
export function BeginButton({ label, onPress, assembled, instant, testID }: BeginButtonProps) {
  const theme = useTheme();
  const shown = assembled || instant;
  const pill = useRiseIn(shown, instant ? 0 : welcome.buttonDelayMs, welcome.cascadeMs);
  const words = useSharedValue(instant ? 1 : 0);
  const size = useSharedValue(instant ? 1 : welcome.punchFrom);
  const lift = useSharedValue(instant ? 0 : welcome.fromY);

  useEffect(() => {
    if (!assembled || instant) return;
    words.set(withDelay(PUNCH_AT, withTiming(1, { duration: PUNCH_FADE_MS })));
    size.set(withDelay(PUNCH_AT, withSpring(1, welcome.punch)));
    lift.set(withDelay(PUNCH_AT, withSpring(0, welcome.punch)));
    const landed = setTimeout(typingFeedback, PUNCH_AT);
    return () => clearTimeout(landed);
  }, [assembled, instant, words, size, lift]);

  const wordsStyle = useAnimatedStyle(() => ({
    opacity: words.get(),
    transform: [{ translateY: lift.get() }, { scale: size.get() }],
  }));

  return (
    <Animated.View style={pill}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityElementsHidden={!shown}
        pointerEvents={shown ? "auto" : "none"}
        onPress={onPress}
        style={[styles.pill, { backgroundColor: theme.colors.controlPrimary }]}
      >
        <View
          pointerEvents="none"
          style={[styles.rule, { borderColor: theme.colors.onControlPrimaryMuted }]}
        />
        <Animated.View style={wordsStyle}>
          <SFProLabel tone="onControlPrimary">{label}</SFProLabel>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: controlHeight.button,
    borderRadius: PILL_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[28],
  },
  // The second rule, just inside the edge, following its curve.
  rule: {
    position: "absolute",
    top: RULE_INSET,
    right: RULE_INSET,
    bottom: RULE_INSET,
    left: RULE_INSET,
    borderRadius: PILL_RADIUS - RULE_INSET,
    borderWidth: RULE_WIDTH,
  },
});
