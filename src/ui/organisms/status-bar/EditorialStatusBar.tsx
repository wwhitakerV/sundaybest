import { Pressable, StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { CapsuleBattery } from "./CapsuleBattery";
import { StatusBarClock } from "./StatusBarClock";
import type { StatusBarBattery, StatusBarPlacement, StatusBarTime } from "./types";

export type EditorialStatusBarProps = {
  time: StatusBarTime;
  /** Null when the phone can't say: the bar shows no battery. */
  battery: StatusBarBattery | null;
  tone: "dark" | "light";
  layout: StatusBarPlacement;
  /** A tap: as iOS's bar does, scrolls the page to its top. */
  onPress: () => void;
  testID: string;
};

/**
 * SundayBest's status bar, in place of iOS's: the time in the editorial face
 * in the left ear, the capsule battery in the right — beside the Dynamic
 * Island or notch, or at a home-button iPhone's edges. Black on the page,
 * white over a dark hero. No signal or Wi-Fi: an app can't know their
 * strength. VoiceOver reads it as one line.
 */
export function EditorialStatusBar({
  time,
  battery,
  tone,
  layout,
  onPress,
  testID,
}: EditorialStatusBarProps) {
  const light = tone === "light";
  const label = battery ? `${time.spoken}, ${battery.spoken}` : time.spoken;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Scrolls to the top"
      onPress={onPress}
      style={[styles.bar, { height: layout.height }]}
    >
      <View style={[styles.ear, timeEar(layout)]}>
        <StatusBarClock testID={`${testID}-time`} time={time} light={light} />
      </View>
      {battery && (
        <View style={[styles.ear, batteryEar(layout)]}>
          <CapsuleBattery testID={`${testID}-battery`} battery={battery} light={light} />
        </View>
      )}
    </Pressable>
  );
}

/** The time centred on `timeX` (or at a home-button bar's left edge). */
function timeEar(layout: StatusBarPlacement) {
  return layout.edged
    ? { left: space[16], alignItems: "flex-start" as const }
    : { left: 0, width: layout.timeX * 2, alignItems: "center" as const };
}

/**
 * The battery centred on `batteryX` (or at a home-button bar's right edge):
 * the ears are the same width, so its box runs `timeX` either side of it.
 */
function batteryEar(layout: StatusBarPlacement) {
  return layout.edged
    ? { right: space[16], alignItems: "flex-end" as const }
    : { left: layout.batteryX - layout.timeX, right: 0, alignItems: "center" as const };
}

const styles = StyleSheet.create({
  bar: { position: "absolute", top: 0, left: 0, right: 0 },
  ear: { position: "absolute", top: 0, bottom: 0, justifyContent: "center" },
});
