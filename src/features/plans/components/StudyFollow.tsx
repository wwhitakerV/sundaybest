import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

/** The animated style for a study page's second beat (`useStepTransition`'s `followStyle`). */
export type FollowStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export type StudyFollowProps = {
  style?: FollowStyle;
  children: ReactNode;
};

/**
 * Everything on a Daily Study page below its kicker and title — the reading,
 * the verses, the question, the prayer — which comes in a beat after them.
 */
export function StudyFollow({ style, children }: StudyFollowProps) {
  return <Animated.View style={[styles.follow, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  follow: { gap: 16 },
});
