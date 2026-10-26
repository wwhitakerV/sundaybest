import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { ASPECT, LABEL_W, STOP_D, STOP_SIDE, STOP_Y, calloutOf } from "../logic/formation-geometry";
import type { FormationLayout } from "../logic/formation-layouts";
import { FormationArtwork } from "./FormationArtwork";

/**
 * The board is laid out on a stage of the reference's own shape (`ASPECT`),
 * the screen's full width: every place is a share of its width (x) or height
 * (y), so nothing is ever stretched. The hero takes the reference's title's
 * place, so the board starts below that band (`TOP`) and ends past its tail
 * (`BOTTOM`).
 */
const BAND = { TOP: 0.05, BOTTOM: 0.93 };
/** An icon's disc fills this share of its square art (the rest is its shadow's room). */
const DISC = 0.7;
/** The stop the reader is on: lit by a glow behind it. */
const NOW = 2;
const CHECK = { x: 0.854, y: 0.092, d: 0.13 };
const NOTE = { x: 0.081, y: 0.488, w: 0.25, rule: 0.07 };
/** A callout's two lines sit centred on its line: this much (of the stage's height) above it. */
const LABEL_LIFT = 0.012;
/** The check's ring, inside its disc: this share of the disc. */
const RING = "52%";
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna.";

export type FormationArtBoardProps = {
  width: number;
  layout: Extract<FormationLayout, { kind: "art" }>;
  /** The icons, top to bottom: asset modules, the first standing in for any missing. */
  arts: readonly [number, ...number[]];
};

/**
 * An artwork version's board (v4…v8): its artwork lifted onto white, five
 * stops along it, each with its callout, the one in hand glowing; a note,
 * and a check — in placeholder words.
 */
export function FormationArtBoard({ width: W, layout, arts }: FormationArtBoardProps) {
  const { colors } = useTheme();
  const H = W / ASPECT;
  const boardH = (BAND.BOTTOM - BAND.TOP) * H;
  const stage = { left: 0, top: -BAND.TOP * H, W, H };
  const at = (x: number, y: number) => ({ left: x * W, top: (y - BAND.TOP) * H });
  const stops = layout.stops.map((x, i) => ({
    x,
    y: STOP_Y[i] ?? 0,
    d: STOP_D[i] ?? 0,
    art: arts[i] ?? arts[0],
    ...calloutOf(x, STOP_D[i] ?? 0, STOP_SIDE[i] ?? "left"),
  }));
  const now = stops[NOW] ?? stops[0]!;
  const checkSize = CHECK.d * W;

  return (
    <View testID="formation-board" style={{ width: W, height: boardH }}>
      <FormationArtwork
        width={W}
        height={boardH}
        stage={stage}
        layout={layout}
        stops={stops}
        now={now}
      />
      <View
        style={[
          styles.place,
          styles.check,
          at(CHECK.x - CHECK.d / 2, CHECK.y - checkSize / H / 2),
          { width: checkSize, height: checkSize, backgroundColor: colors.accent },
        ]}
      >
        <View style={[styles.ring, { borderColor: colors.onAccent }]}>
          <Check size={checkSize * 0.22} color={colors.onAccent} strokeWidth={1.5} />
        </View>
      </View>

      <View style={[styles.place, at(NOTE.x, NOTE.y), { width: NOTE.w * W }]}>
        <View style={[styles.rule, { width: NOTE.rule * W, backgroundColor: colors.accent }]} />
        <SFProBody variant="note">{LOREM}</SFProBody>
        <MonoLabel variant="date" tone="textMuted" style={styles.meta}>
          LOREM — IPSUM
        </MonoLabel>
      </View>

      {stops.map((stop) => {
        const size = (stop.d * W) / DISC;
        return (
          <View key={`stop-${stop.y}`} pointerEvents="none">
            <View
              style={[
                styles.place,
                styles.shadow,
                { shadowColor: colors.text, width: size, height: size },
                at(stop.x - size / W / 2, stop.y - size / H / 2),
              ]}
            >
              <Image source={stop.art} style={styles.fill} contentFit="contain" />
            </View>
            <View style={[styles.place, at(stop.lx, stop.y - LABEL_LIFT), { width: LABEL_W * W }]}>
              <MonoLabel variant="date" tone="textSupporting">
                {"LOREM\nIPSUM"}
              </MonoLabel>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  place: { position: "absolute" },
  check: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ring: {
    width: RING,
    height: RING,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: { height: 2 },
  meta: { marginTop: space[12] },
  shadow: { shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
});
