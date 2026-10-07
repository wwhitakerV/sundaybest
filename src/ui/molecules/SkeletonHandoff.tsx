import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type CSSStyle } from "react-native-reanimated";

import { motion } from "@/theme";

/** A dissolve, not motion: it plays with Reduce Motion on, too. */
const fade = (from: number, to: number, fill: "backwards" | "forwards"): CSSStyle<ViewStyle> => ({
  animationName: { from: { opacity: from }, to: { opacity: to } },
  animationDuration: motion.handoffMs,
  animationTimingFunction: "ease-out",
  animationFillMode: fill,
});
const FADE_IN = fade(0, 1, "backwards");
const FADE_OUT = fade(1, 0, "forwards");

export type SkeletonHandoffProps = {
  /** True while the content is on its way: the skeleton shows instead. */
  pending: boolean;
  /** What shows while it's pending: a `Skeleton`, or a whole pending screen. */
  skeleton: ReactNode;
  /** The content — rendered only once it's no longer pending. */
  children: ReactNode;
  /** A whole screen handing over to another (Study, a plan): fills its parent. */
  fill?: boolean;
  /** Layout for the content's wrapper, in place of the parent's (a gap between its parts). */
  style?: StyleProp<ViewStyle>;
  testID: string;
};

/**
 * Where a skeleton hands over to its content — never a snap. Once the
 * content arrives, the skeleton stays over it a moment, fading out as the
 * content fades in under it, then goes. Both fades are declared in their
 * styles (Reanimated CSS animations), so they play as each mounts, and the
 * skeleton is let go on a timer, not on an animation's callback — nothing
 * can leave it stuck. Content that never waited simply shows.
 */
export function SkeletonHandoff({
  pending,
  skeleton,
  children,
  fill = false,
  style,
  testID,
}: SkeletonHandoffProps) {
  const [waited, setWaited] = useState(pending);
  const [leaving, setLeaving] = useState(false);
  const [wasPending, setWasPending] = useState(pending);

  // Adjusted during render, so the content and the leaving skeleton arrive in one commit.
  if (wasPending !== pending) {
    setWasPending(pending);
    setLeaving(wasPending && !pending);
    if (pending) setWaited(true);
  }

  if (pending) return skeleton;

  return (
    <View style={fill ? styles.fill : undefined}>
      <Animated.View
        testID={`${testID}-content`}
        style={[fill ? styles.fill : style, waited && FADE_IN]}
      >
        {children}
      </Animated.View>
      {leaving && (
        <Leaving testID={`${testID}-leaving`} fill={fill} setLeaving={setLeaving}>
          {skeleton}
        </Leaving>
      )}
    </View>
  );
}

/** The skeleton on its way out: over the content, fading, hidden from VoiceOver and touch. */
function Leaving({
  fill,
  setLeaving,
  children,
  testID,
}: {
  fill: boolean;
  /** React's own setter — stable, so the timer starts once and is never reset. */
  setLeaving: (leaving: boolean) => void;
  children: ReactNode;
  testID: string;
}) {
  useEffect(() => {
    const timer = setTimeout(() => setLeaving(false), motion.handoffMs);
    return () => clearTimeout(timer);
  }, [setLeaving]);

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[fill ? StyleSheet.absoluteFill : styles.over, FADE_OUT]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Over the content's top, at the skeleton's own height.
  over: { position: "absolute", top: 0, left: 0, right: 0 },
});
