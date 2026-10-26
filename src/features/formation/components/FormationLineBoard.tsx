import { useMemo } from "react";
import {
  AlphaType,
  Canvas,
  Circle,
  ColorType,
  Group,
  Image,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Shadow,
  Skia,
  useImage,
  vec,
  type SkImage,
} from "@shopify/react-native-skia";

import { useTheme } from "@/theme";
import { iconMetricsOf, type Rgb } from "../logic/formation-icon-metrics";
import { arrowheadOf, pathwayStretchesOf } from "../logic/formation-line";
import type { FormationLayout } from "../logic/formation-layouts";
import { shadingOf, type Rgba } from "../logic/formation-shading";

/** The line's weight (points), and how far it fades over its tail past the last stop. */
const LINE = { width: 1, tailFade: 0.35 };
/** The glow sits this share of the way toward the icon's shadow, as light spills from it. */
const GLOW_DRIFT = 0.6;
const CLEAR: Rgba = [0, 0, 0, 0];

const paint = (c: Rgba) => Float32Array.of(c[0], c[1], c[2], c[3]);

/** An icon's metrics, read from its own pixels once it's loaded. */
function metricsOf(image: SkImage | null) {
  if (!image) return null;
  const width = image.width();
  const height = image.height();
  const pixels = image.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  return pixels ? iconMetricsOf(pixels, width, height) : null;
}

type LineLayout = Extract<FormationLayout, { kind: "line" }>;

export type FormationLineBoardProps = {
  width: number;
  height: number;
  layout: LineLayout;
  /** The icons, top to bottom: asset modules. */
  arts: readonly number[];
  testID?: string;
};

/**
 * vLine's board, drawn as its reference is: one fine line through the stops,
 * its colour along each stretch taken from the icons it runs between, fading
 * over its tail to a small arrow; and the icons on it, each read from its own
 * pixels (`iconMetricsOf`) — its disc set to its size and place, its shadow
 * cast down and to the left by its size, tinted by its colour, its shading
 * lit from the top right, clipped to its own shape (`shadingOf`) — the one in
 * hand glowing in its colour.
 */
export function FormationLineBoard({
  width,
  height,
  layout,
  arts,
  testID,
}: FormationLineBoardProps) {
  const { colors } = useTheme();
  const eye = useImage(arts[0]);
  const brain = useImage(arts[1]);
  const mouth = useImage(arts[2]);
  const shield = useImage(arts[3]);
  const heart = useImage(arts[4]);
  const metrics = useMemo(
    () => [eye, brain, mouth, shield, heart].map(metricsOf),
    [eye, brain, mouth, shield, heart],
  );
  const images = [eye, brain, mouth, shield, heart];
  const text = Skia.Color(colors.text);
  const ink: Rgb = [text[0] ?? 0, text[1] ?? 0, text[2] ?? 0];
  const toPx = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * height });

  const icons = layout.spots.flatMap((spot, i) => {
    const m = metrics[i];
    const image = images[i];
    if (!m || !image) return [];
    const radius = (spot.d * width) / 2;
    const w = radius / m.r;
    const h = (w * image.height()) / image.width();
    const centre = toPx(spot);
    return [
      {
        image,
        centre,
        radius,
        x: centre.x - m.cx * w,
        y: centre.y - m.cy * h,
        w,
        h,
        ...shadingOf(m, radius, width, ink),
      },
    ];
  });

  // The line's colour at each of its points: its icons', the nearer counting the more.
  const points = layout.path.map(toPx);
  const last = icons.at(-1);
  const tailFrom = last
    ? points.findIndex((p) => Math.hypot(p.x - last.centre.x, p.y - last.centre.y) < 1)
    : points.length;
  const colourAt = (p: { x: number; y: number }, k: number): Rgba => {
    let total = 0;
    const sum = [0, 0, 0];
    for (const icon of icons) {
      const weight =
        1 / (Math.hypot(p.x - icon.centre.x, p.y - icon.centre.y) ** 2 + icon.radius ** 2);
      total += weight;
      for (let c = 0; c < 3; c += 1) sum[c] = (sum[c] ?? 0) + (icon.line[c] ?? 0) * weight;
    }
    const tail =
      tailFrom >= 0 && k > tailFrom ? (k - tailFrom) / (points.length - 1 - tailFrom) : 0;
    const alpha = 1 - (1 - LINE.tailFade) * tail;
    return total > 0
      ? [(sum[0] ?? 0) / total, (sum[1] ?? 0) / total, (sum[2] ?? 0) / total, alpha]
      : CLEAR;
  };
  const stops = points.map(colourAt);
  const now = icons[layout.now];

  return (
    <Canvas testID={testID} style={{ width, height }} pointerEvents="none">
      {pathwayStretchesOf(points).map((stretch, k) => (
        <Path
          key={`line-${k}`}
          path={stretch.d}
          style="stroke"
          strokeWidth={LINE.width}
          strokeCap="round"
        >
          <LinearGradient
            start={vec(stretch.from.x, stretch.from.y)}
            end={vec(stretch.to.x, stretch.to.y)}
            colors={[paint(stops[k] ?? CLEAR), paint(stops[k + 1] ?? CLEAR)]}
          />
        </Path>
      ))}
      <Path
        path={arrowheadOf(points)}
        style="stroke"
        strokeWidth={LINE.width}
        strokeCap="round"
        strokeJoin="round"
        color={paint(stops.at(-1) ?? CLEAR)}
      />
      {now && (
        <Circle
          cx={now.centre.x + now.shadow.dx * GLOW_DRIFT}
          cy={now.centre.y + now.shadow.dy * GLOW_DRIFT}
          r={now.glow.reach}
        >
          <RadialGradient
            c={vec(
              now.centre.x + now.shadow.dx * GLOW_DRIFT,
              now.centre.y + now.shadow.dy * GLOW_DRIFT,
            )}
            r={now.glow.reach}
            colors={[paint(now.glow.colour), paint(CLEAR)]}
          />
        </Circle>
      )}
      {icons.map((icon, i) => (
        <Group key={`icon-${i}`}>
          <Image image={icon.image} x={icon.x} y={icon.y} width={icon.w} height={icon.h} fit="fill">
            <Shadow
              dx={icon.shadow.dx}
              dy={icon.shadow.dy}
              blur={icon.shadow.blur}
              color={paint(icon.shadow.colour)}
              shadowOnly
            />
          </Image>
          <Group layer>
            <Image
              image={icon.image}
              x={icon.x}
              y={icon.y}
              width={icon.w}
              height={icon.h}
              fit="fill"
            />
            <Rect x={icon.x} y={icon.y} width={icon.w} height={icon.h} blendMode="srcATop">
              <LinearGradient
                start={vec(icon.x + icon.w, icon.y)}
                end={vec(icon.x, icon.y + icon.h)}
                colors={[paint(icon.highlight), paint(CLEAR), paint(icon.shade)]}
              />
            </Rect>
          </Group>
        </Group>
      ))}
    </Canvas>
  );
}
