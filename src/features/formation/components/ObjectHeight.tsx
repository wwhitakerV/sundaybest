import {
  Blur,
  Circle,
  FractalNoise,
  Group,
  ColorMatrix,
  Paint,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";

import type { IdealObject } from "../logic/formation-ideal";
import { BODY_TOP, profileOf, reliefFormOf } from "../logic/formation-relief";
import { seedOf } from "../logic/formation-stone";
import { greyNoise, greyOf } from "./ideal-paint";
import { sculptOutlineOf } from "./sculpt-outline";
import { stoneWearOf } from "./stone-wear";
import { StoneHeight } from "./StoneHeight";
import { LinenHeight } from "./LinenFace";
import { IconFaceHeight } from "./IconFaceHeight";
import { PlaqueGloss, PlaqueHeight } from "./PlaqueHeight";
import { SculptedBallHeight } from "./SculptedBall";

/** The whole map softened a touch (points): no step in it ever reads as a ridge. */
const SOFTEN = 0.5;
/**
 * A fine tooth over every surface, in its height: it breaks up the map's
 * steps, and catches the light as a matte surface's tooth does (how fine,
 * per point of the radius, and how deep).
 */
const TOOTH = { fine: 4, depth: 0.018 };

export type ObjectHeightProps = { object: IdealObject; centre: number; r: number };

/** A stone sculpt's height map, shaped (and carved) by its icon. */
function SculptHeight({ object, centre, r }: ObjectHeightProps) {
  const sculpt = object.icon && sculptOutlineOf(object.icon);
  if (!sculpt) return null;
  return (
    <StoneHeight
      wear={stoneWearOf(sculpt.outline, seedOf(object.id))}
      centre={centre}
      r={r}
      carving={sculpt.carving}
    />
  );
}

/**
 * An object's height map, white highest, for the surface shader: its body's
 * profile — the ceramic's cap, the puck's rounded rim, the pillow, the
 * ball, the stone sculpt's pitted mound — and its icon raised from it or
 * sunk into it.
 */
export function ObjectHeight({ object, centre, r }: ObjectHeightProps) {
  const form = reliefFormOf(object);
  const size = centre * 2;
  return (
    <Group
      layer={
        <Paint>
          <Blur blur={SOFTEN} />
        </Paint>
      }
    >
      <Rect x={0} y={0} width={size} height={size} color={greyOf(0, 1)} />
      {form === "sculpt" ? (
        <SculptHeight object={object} centre={centre} r={r} />
      ) : (
        <Circle cx={centre} cy={centre} r={r}>
          <RadialGradient
            c={vec(centre, centre)}
            r={r}
            colors={profileOf(form).height.map((h) => greyOf(h * BODY_TOP, 1))}
            positions={profileOf(form).at}
          />
        </Circle>
      )}
      {/* The tooth goes on before the plaque and the icon, which are smoother. */}
      <Rect x={0} y={0} width={size} height={size} blendMode="plus">
        <FractalNoise freqX={(TOOTH.fine / r) * 10} freqY={(TOOTH.fine / r) * 10} octaves={2} />
        <ColorMatrix matrix={greyNoise(TOOTH.depth)} />
      </Rect>
      {object.plaque && <PlaqueHeight object={object} centre={centre} r={r} />}
      <LinenHeight object={object} centre={centre} r={r} />
      <IconFaceHeight object={object} centre={centre} r={r} />
      {object.form === "ball" && object.icon && (
        <SculptedBallHeight icon={object.icon} centre={centre} r={r} />
      )}
      {object.plaque && <PlaqueGloss object={object} centre={centre} r={r} />}
    </Group>
  );
}
