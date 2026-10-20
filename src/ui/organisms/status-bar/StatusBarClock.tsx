import { StyleSheet, View } from "react-native";

import { StatusLabel } from "@/ui/typography/StatusLabel";
import type { StatusBarTime } from "./types";

/** The colon sits a step smaller than the figures; this raises it to their middle. */
const COLON_RAISE = -1.5;

export type StatusBarClockProps = { time: StatusBarTime; light: boolean; testID: string };

/**
 * The status bar's time in the editorial face, its colon a step smaller and
 * raised to the figures' middle. Hidden from VoiceOver: the bar reads it aloud.
 */
export function StatusBarClock({ time, light, testID }: StatusBarClockProps) {
  const tone = light ? "statusInkOnDark" : "statusInk";
  return (
    <View
      testID={testID}
      style={styles.clock}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <StatusLabel variant="time" tone={tone}>
        {time.hours}
      </StatusLabel>
      <StatusLabel variant="colon" tone={tone} style={styles.colon}>
        :
      </StatusLabel>
      <StatusLabel variant="time" tone={tone}>
        {time.minutes}
      </StatusLabel>
    </View>
  );
}

const styles = StyleSheet.create({
  clock: { flexDirection: "row", alignItems: "baseline" },
  colon: { transform: [{ translateY: COLON_RAISE }] },
});
