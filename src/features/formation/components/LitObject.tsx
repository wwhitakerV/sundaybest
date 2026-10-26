import { FilterMode, ImageShader, Rect, Shader, type SkImage } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { IDEAL_OBJECTS, type IdealObject } from "../logic/formation-ideal";
import { BODY_TOP, RELIEF_DEPTH, RELIEF_FINISH, reliefFormOf } from "../logic/formation-relief";
import { lightAt } from "../logic/formation-shadow";
import { LIT_EFFECT } from "./lit-effect";

/** Its maps sampled smoothly between their pixels, so its slopes never step. */
const SMOOTH = { filter: FilterMode.Linear };

export type ObjectMaps = { height: SkImage; albedo: SkImage };

export type LitObjectProps = {
  object: IdealObject;
  cx: number;
  cy: number;
  /** Its radius, and the side of the square its maps cover (points). */
  r: number;
  box: number;
  maps: ObjectMaps;
  /** Toward the light where it is now, as it moves; still, its own station's. */
  light?: SharedValue<number[]>;
};

/**
 * An object drawn as the light falls on it: its colour map lit by the
 * surface shader (`LIT_EFFECT`) from the slope of its height map — its body
 * and the symbol set into it alike — in the light where it is (`lightAt`),
 * which turns a little from station to station as its shadow does.
 */
export function LitObject({ object, cx, cy, r, box, maps, light }: LitObjectProps) {
  const finish = RELIEF_FINISH[object.finish];
  const rect = { x: cx - box / 2, y: cy - box / 2, width: box, height: box };
  const still = lightAt(IDEAL_OBJECTS.indexOf(object));
  const fixed = {
    texel: box / maps.height.width(),
    depth: (RELIEF_DEPTH[reliefFormOf(object)] * r) / BODY_TOP,
    ambient: finish.ambient,
    bounce: [...finish.bounce],
    wrap: finish.wrap,
    sheen: finish.sheen,
    tight: finish.tight,
    rimReach: finish.rim.reach * r,
    rimLit: finish.rim.lit,
    rimBounce: finish.rim.bounce,
    rimWarm: [...finish.rim.warm],
    neutral: finish.neutral,
    stainReach: finish.stain.reach * r,
    stainWideReach: finish.stain.wideReach * r,
    stain: finish.stain.strength,
    stainWide: finish.stain.wide,
    polish: finish.stain.polish,
    stainTint: [...finish.stain.tint],
  };
  const uniforms = useDerivedValue(() => ({ ...fixed, light: light ? light.value : still }));
  if (!LIT_EFFECT) return null;
  return (
    <Rect {...rect}>
      <Shader source={LIT_EFFECT} uniforms={uniforms}>
        <ImageShader image={maps.height} fit="fill" rect={rect} sampling={SMOOTH} />
        <ImageShader image={maps.albedo} fit="fill" rect={rect} sampling={SMOOTH} />
      </Shader>
    </Rect>
  );
}
