import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { GenerationBarView } from "../logic/generation-bar";

/** The progress line's thickness: a hairline you can still read at a glance. */
const TRACK_HEIGHT = 4;
const PROGRESS_EASE_MS = 600;

/** The bar's words — and, while building, its progress line — to the right of the divider. */
export function GenerationBarContent({
  view,
  testID,
}: {
  view: GenerationBarView;
  testID: string;
}) {
  if (view.kind === "building") {
    const count = view.more + 1;
    return (
      <View style={styles.stack}>
        <View style={styles.titleRow}>
          <SFProBody
            variant="listItem"
            tone="onControlPrimary"
            numberOfLines={1}
            style={styles.title}
          >
            {count === 1 ? "Generating plan" : `Generating ${count} plans`}
          </SFProBody>
          <SFProBody variant="detail" tone="onControlPrimaryMuted">{`${view.percent}%`}</SFProBody>
        </View>
        <ProgressLine percent={view.percent} testID={`${testID}-progress`} />
      </View>
    );
  }
  const ready = view.kind === "ready";
  return (
    <View style={styles.stack}>
      <SFProBody
        variant="listItem"
        tone={ready ? "onSuccess" : "onControlPrimary"}
        numberOfLines={1}
      >
        {ready ? "Your plan is ready" : "Couldn’t build your plan"}
      </SFProBody>
      <SFProBody
        variant="detail"
        tone={ready ? "onSuccessMuted" : "onControlPrimaryMuted"}
        numberOfLines={1}
      >
        {ready ? view.title : view.reason}
      </SFProBody>
    </View>
  );
}

/** How far along, in the accent, on a faint track; eases to each new value. */
function ProgressLine({ percent, testID }: { percent: number; testID: string }) {
  const theme = useTheme();
  const shown = useSharedValue(percent);

  useEffect(() => {
    shown.set(
      withTiming(percent, { duration: PROGRESS_EASE_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [percent, shown]);

  const fill = useAnimatedStyle(() => ({ width: `${shown.value}%` }));

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.onControlPrimaryFaint }]}>
      <Animated.View
        testID={testID}
        style={[styles.fill, { backgroundColor: theme.colors.accent }, fill]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[4] },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: space[8] },
  title: { flexShrink: 1 },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: space[4],
  },
  fill: { height: TRACK_HEIGHT, borderRadius: radius.pill },
});
