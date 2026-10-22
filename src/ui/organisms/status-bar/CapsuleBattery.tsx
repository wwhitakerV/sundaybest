import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, G, Mask, Path, Rect } from "react-native-svg";

import { useTheme } from "@/theme";
import { BOLT_PATH, BOLT_PATH_ON_DARK, chargingBolts, dabSolidEnd } from "./battery-bolts";
import { BRUSH_BOX, BRUSH_PATH } from "./brush-stroke";
import type { StatusBarBattery } from "./types";

/** The stroke's box, inside the case: long and tall enough that its dry-brush ends read as paint. */
const STROKE = { width: 31, height: 11 };
/**
 * The case round the stroke, so it reads at a glance as a battery: a fine
 * outline with softly squared corners — never a round pill — the stroke
 * this far inside it.
 */
const CASE = { edge: 1, inset: 1, corner: 4 };
/** The case and its cap, a shade softer than the paint: they frame the charge, never compete with it. */
const CASE_OPACITY = 0.45;
/** The case's cap, close after it: small and solid, as a battery's terminal is. */
const CAP = { width: 2, height: 5, apart: 1 };
/** How faintly the full stroke shows behind the charge: enough to see what "full" is. */
const TRACK_OPACITY = 0.14;
/** Low Power Mode's stroke: drawn hollow, its outline this fine. */
const HOLLOW_EDGE = 0.75;
/**
 * Below this charge the paint is a dab — the whole stroke drawn short —
 * since a stroke revealed only this far would show nothing but its dry
 * bristles.
 */
const DAB_BELOW = 0.25;
/** Where the stroke's ragged tip turns solid, as a share of its length: bolts past it read as uncharged. */
const TIP_SHARE = 0.08;
/** The brush in the stroke's box, `length` of its full length. */
const brushTransform = (length: number) =>
  `scale(${(length * STROKE.width) / BRUSH_BOX.width} ${STROKE.height / BRUSH_BOX.height})`;
/** The full stroke slid left, so only `charge` of it overlaps the stroke in place. */
const slidTransform = (charge: number) =>
  `translate(${-(1 - charge) * STROKE.width} 0) ${brushTransform(1)}`;

/** Bolts at their places (`chargingBolts`), in one ink — the firmer drawing on a dark background. */
function Bolts({
  places,
  fill,
  heavier,
  testID,
}: {
  places: readonly string[];
  fill: string;
  heavier: boolean;
  testID?: string;
}) {
  return places.map((transform, index) => (
    <Path
      key={transform}
      {...(testID && { testID: `${testID}-${index}` })}
      d={heavier ? BOLT_PATH_ON_DARK : BOLT_PATH}
      transform={transform}
      fill={fill}
    />
  ));
}

export type CapsuleBatteryProps = {
  battery: StatusBarBattery;
  light: boolean;
  testID: string;
};

/**
 * The status bar's battery: a brush stroke — the wordmark's and the launch
 * intro's gesture — painted as far as the charge, over the full stroke drawn
 * faintly so "full" can be seen. The charge is the stroke itself, revealed
 * through a copy of it slid in from the left, as the intro lays its stroke:
 * its real dry-brush start, and always a ragged tip where the charge ends;
 * below a quarter, a dab. Never figures (iOS gives apps its level only in 5%
 * steps), in a fine battery case with a cap, so it reads at a glance as a
 * battery. Red at 20% or less, hollow in Low Power Mode. While
 * it charges, bolts are cut out of the paint — only where the paint is, one,
 * two, then three as it fills (`chargingBolts`) — so plugging in never
 * changes its width. Hidden from VoiceOver: the bar reads it aloud.
 */
export function CapsuleBattery({ battery, light, testID }: CapsuleBatteryProps) {
  const { colors } = useTheme();
  const ids = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ink = light ? colors.statusInkOnDark : colors.statusInk;
  const strokeInk = battery.tone === "low" ? colors.accent : ink;
  const charge = Math.min(Math.max(battery.level, 0), 100) / 100;
  const dab = charge < DAB_BELOW;
  const paint = battery.hollow
    ? {
        fill: "transparent",
        stroke: strokeInk,
        strokeWidth: HOLLOW_EDGE,
        vectorEffect: "non-scaling-stroke" as const,
      }
    : { fill: strokeInk };
  // While it charges: bolts only where the paint is, cut out of it (drawn in ink on a hollow stroke).
  const paintEnd = dab ? dabSolidEnd(charge, STROKE.width) : (charge - TIP_SHARE) * STROKE.width;
  const bolts =
    battery.charging && charge > 0 ? chargingBolts(charge, STROKE, { dab, paintEnd }) : [];
  const cut = bolts.length > 0 && !battery.hollow ? `url(#${ids}-bolt-cut)` : undefined;

  return (
    <View
      testID={testID}
      style={styles.battery}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.case}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.outline, { borderColor: ink }]}
        />
        <Svg
          testID={`${testID}-stroke`}
          width={STROKE.width}
          height={STROKE.height}
          viewBox={`0 0 ${STROKE.width} ${STROKE.height}`}
        >
          <Defs>
            {/* As far as the charge: the stroke's own copy, slid in from the left. */}
            <Mask id={`${ids}-charge`} maskUnits="userSpaceOnUse">
              <Path d={BRUSH_PATH} transform={slidTransform(charge)} fill="white" />
            </Mask>
            {cut && (
              // Everything but the bolts: the paint they're cut out of.
              <Mask id={`${ids}-bolt-cut`} maskUnits="userSpaceOnUse">
                <Rect width={STROKE.width} height={STROKE.height} fill="white" />
                <Bolts places={bolts} fill="black" heavier={light} />
              </Mask>
            )}
          </Defs>
          <G mask={cut}>
            <Path
              d={BRUSH_PATH}
              transform={brushTransform(1)}
              fill={ink}
              fillOpacity={TRACK_OPACITY}
            />
            {charge > 0 &&
              (dab ? (
                <Path
                  testID={`${testID}-charge`}
                  d={BRUSH_PATH}
                  transform={brushTransform(charge)}
                  {...paint}
                />
              ) : (
                <G mask={`url(#${ids}-charge)`}>
                  <Path
                    testID={`${testID}-charge`}
                    d={BRUSH_PATH}
                    transform={brushTransform(1)}
                    {...paint}
                  />
                </G>
              ))}
          </G>
          {battery.hollow && bolts.length > 0 && (
            <Bolts places={bolts} fill={strokeInk} heavier={light} testID={`${testID}-bolt`} />
          )}
        </Svg>
      </View>
      <View style={[styles.cap, { backgroundColor: ink }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  battery: { flexDirection: "row", alignItems: "center" },
  // Room for the outline and the gap inside it; the outline is drawn over it, softened.
  case: { padding: CASE.inset + CASE.edge },
  outline: { borderWidth: CASE.edge, borderRadius: CASE.corner, opacity: CASE_OPACITY },
  cap: {
    width: CAP.width,
    height: CAP.height,
    marginLeft: CAP.apart,
    borderTopRightRadius: CAP.width / 2,
    borderBottomRightRadius: CAP.width / 2,
    opacity: CASE_OPACITY,
  },
});
