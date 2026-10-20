import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/theme";
import { StatusLabel } from "@/ui/typography/StatusLabel";
import type { StatusBarBattery } from "./types";

/** The capsule, a little larger than iOS's battery: its figures, in the serif, read at a glance. */
const BODY = { width: 31, height: 15, edge: 1 };
/** The end cap, close after the capsule: a full stop, or a bolt while it charges. */
const DOT = 4;
const CAP_GAP = 1;
/**
 * The bolt, drawn for the battery rather than taken from an icon set: long
 * sharp tips, a short step across its middle, solid ink — 7 × 11pt, at the
 * scale it was drawn on.
 */
const BOLT_PATH = "M4.9 0 L0.4 6.6 L3.2 6.6 L2.1 11 L6.6 4.4 L3.8 4.4 Z";
const BOLT = { width: 7, height: 11 };
/** Set by eye on the phone: as iOS lays them out, the figures sit 1pt low in the capsule. */
const FIGURES_RAISE = 1;

export type CapsuleBatteryProps = {
  battery: StatusBarBattery;
  light: boolean;
  testID: string;
};

/**
 * The status bar's battery: a capsule outline with its percentage inside in
 * the serif — no fill, which would cross the figures. Red at 20% or less,
 * italic in Low Power Mode; a full stop after it, a bolt while it charges.
 * Hidden from VoiceOver: the bar reads it aloud.
 */
export function CapsuleBattery({ battery, light, testID }: CapsuleBatteryProps) {
  const { colors } = useTheme();
  const ink = light ? colors.statusInkOnDark : colors.statusInk;
  const figures = battery.tone === "low" ? "accent" : light ? "statusInkOnDark" : "statusInk";

  return (
    <View
      testID={testID}
      style={styles.battery}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.body, { borderColor: ink }]}>
        <StatusLabel
          variant="figures"
          tone={figures}
          italic={battery.italic}
          style={styles.figures}
        >
          {String(battery.level)}
        </StatusLabel>
      </View>
      <View style={styles.cap}>
        {battery.endCap === "bolt" ? (
          <Svg testID={`${testID}-bolt`} width={BOLT.width} height={BOLT.height} viewBox="0 0 7 11">
            <Path d={BOLT_PATH} fill={ink} />
          </Svg>
        ) : (
          <View testID={`${testID}-dot`} style={[styles.dot, { borderColor: ink }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  battery: { flexDirection: "row", alignItems: "center" },
  body: {
    width: BODY.width,
    height: BODY.height,
    borderWidth: BODY.edge,
    borderRadius: BODY.height / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  figures: { transform: [{ translateY: -FIGURES_RAISE }] },
  cap: { marginLeft: CAP_GAP },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: BODY.edge },
});
