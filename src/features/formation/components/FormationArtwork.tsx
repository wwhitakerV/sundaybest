import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Image as SvgImage, Path, RadialGradient, Stop } from "react-native-svg";

import { useTheme } from "@/theme";
import { hairlinesOf } from "../logic/formation-geometry";
import type { FormationLayout } from "../logic/formation-layouts";

/** The stop in hand's red dot: this far back to its left, in shares of the stage's width. */
const DOT_BACK = 0.231;

type Stage = { left: number; top: number; W: number; H: number };
type Spot = { x: number; y: number; d: number; from: number; to: number };

export type FormationArtworkProps = {
  width: number;
  height: number;
  stage: Stage;
  layout: FormationLayout;
  stops: Spot[];
  /** The stop in hand. */
  now: Spot;
};

/**
 * What's drawn under an artwork version's words and icons, on its white page:
 * the artwork, lifted onto white beforehand so it has no edge, the glow and
 * ring round the stop in hand with its red dot, and every hairline — the
 * callouts' and the reference's own. (vLine draws its own: `FormationLineBoard`.)
 */
export function FormationArtwork({
  width,
  height,
  stage,
  layout,
  stops,
  now,
}: FormationArtworkProps) {
  const { colors } = useTheme();
  const { left, top, W, H } = stage;
  // The artwork's place, for a version with one: its proportions kept.
  const art =
    layout.kind === "art"
      ? {
          x: left + layout.ribbon.x * W,
          y: top + layout.ribbon.y * H,
          w: layout.ribbon.w * W,
          h: layout.ribbon.w * W * layout.ratio,
          href: layout.art,
        }
      : null;
  const point = (x: number, y: number) => `${left + x * W} ${top + y * H}`;
  const callouts = stops.map((s) => `M ${point(s.from, s.y)} L ${point(s.to, s.y)}`).join(" ");
  const line = { stroke: colors.textMuted, strokeWidth: StyleSheet.hairlineWidth, fill: "none" };
  const nowAt = { cx: left + now.x * W, cy: top + now.y * H };
  const dot = { cx: left + (now.x - DOT_BACK) * W, cy: nowAt.cy };

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.accent} stopOpacity={0.55} />
          <Stop offset="0.55" stopColor={colors.accent} stopOpacity={0.18} />
          <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {art ? (
        <SvgImage
          href={art.href}
          x={art.x}
          y={art.y}
          width={art.w}
          height={art.h}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}
      <Circle
        cx={nowAt.cx + 0.03 * W}
        cy={nowAt.cy + 0.01 * H}
        r={now.d * W * 0.95}
        fill="url(#glow)"
      />
      <Path d={`${hairlinesOf(stops, point)} ${callouts}`} {...line} />
      <Circle {...nowAt} r={now.d * W * 0.78} {...line} />
      <Circle {...dot} r={W * 0.022} fill={colors.accent} opacity={0.25} />
      <Circle {...dot} r={W * 0.008} fill={colors.accent} />
    </Svg>
  );
}
