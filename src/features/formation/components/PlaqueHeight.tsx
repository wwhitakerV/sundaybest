import {
  BlurMask,
  Circle,
  ColorMatrix,
  FractalNoise,
  Group,
  Path,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";

import { PLAQUE_PATH } from "../logic/formation-glyphs";
import type { IdealObject } from "../logic/formation-ideal";
import { BODY_TOP, profileOf, reliefFormOf } from "../logic/formation-relief";
import { greyNoise, greyOf } from "./ideal-paint";

/**
 * The plaque's relief, read off its reference: its face follows the body's
 * curve only a little (`follow`), so it's nearly flat; it stands this much
 * proud of the body (`lift`, of the map's height) — clearly raised, its
 * edge a crisp step the map's own softening rounds into a narrow fillet —
 * and its surface is smoother than the body's (`tooth`, of the body's).
 */
const PLAQUE = { follow: 0.4, lift: 0.32, tooth: 0.3 };
/**
 * The raised rim round the plaque's edge, like a frame (of the dome's
 * radius, and of the map's height): its crest catches the light in a crisp
 * line on the side that faces it, a narrow dip just inside it.
 */
const RIM = { width: 0.03, height: 0.03, soft: 0.006 };
/** The body's tooth, for the plaque's finer one: how fine and how deep. */
const TOOTH = { fine: 4, depth: 0.018 };

export type PlaqueHeightProps = { object: IdealObject; centre: number; r: number };

/**
 * The plaque standing off a dome, in its height map: a near-flat raised
 * plateau cut to the shield's outline (`PLAQUE_PATH`), a raised rim
 * round its edge, and a crisp step down to the dome — so the light draws a
 * bright line along the edge that faces it and a dark one along the edge
 * that turns away.
 */
export function PlaqueHeight({ object, centre, r }: PlaqueHeightProps) {
  const form = reliefFormOf(object);
  if (form === "heart") return null;
  const profile = profileOf(form);
  const face = profile.height.map((h) => greyOf(h * BODY_TOP * PLAQUE.follow + PLAQUE.lift, 1));
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Group clip={PLAQUE_PATH}>
        <Circle cx={0} cy={0} r={1.2}>
          <RadialGradient c={vec(0, 0)} r={1} colors={face} positions={profile.at} />
        </Circle>
        <Rect x={-1} y={-1} width={2} height={2} blendMode="plus">
          <FractalNoise freqX={TOOTH.fine * 10} freqY={TOOTH.fine * 10} octaves={2} />
          <ColorMatrix matrix={greyNoise(TOOTH.depth * PLAQUE.tooth)} />
        </Rect>
        <Path
          path={PLAQUE_PATH}
          style="stroke"
          strokeWidth={RIM.width * 2}
          strokeJoin="round"
          color={greyOf(RIM.height, 1)}
          blendMode="plus"
        >
          <BlurMask blur={RIM.soft} style="normal" />
        </Path>
      </Group>
    </Group>
  );
}
