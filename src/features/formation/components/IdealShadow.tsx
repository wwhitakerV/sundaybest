import type { SkImage } from "@shopify/react-native-skia";

import { FORMATION_PAPER } from "@/theme";
import { IDEAL_OBJECTS, type IdealObject } from "../logic/formation-ideal";
import { stationLight } from "../logic/formation-light";
import { shadowAt } from "../logic/formation-shadow";
import { withAlpha } from "./ideal-paint";
import { shadowTransform } from "./shadow-shape";
import { ShadowCopy } from "./ShadowCopy";

/** The shadow tint each finish multiplies into the page (`FORMATION_PAPER`). */
export const TINTS = {
  ceramic: FORMATION_PAPER.shadow,
  stone: FORMATION_PAPER.shadowStone,
  red: FORMATION_PAPER.shadowRed,
} as const;

export type IdealShadowProps = {
  object: IdealObject;
  cx: number;
  cy: number;
  diameter: number;
  /** Its artwork, whose outline it throws; nothing until it's ready. */
  image: SkImage | null;
};

/**
 * What a still object throws onto the page, at its own station's height and
 * in the reference's light there (`stationLight`, `shadowAt`): its cast shadow, drawn out along the way the
 * light falls, and its contact shadow at its foot — each its artwork's
 * outline, multiplied into the page in its finish's measured tint.
 */
export function IdealShadow({ object, cx, cy, diameter, image }: IdealShadowProps) {
  if (!image) return null;
  const r = diameter / 2;
  const station = IDEAL_OBJECTS.indexOf(object);
  const fit = shadowAt(station, object.d / 2, stationLight(station));
  const tint = withAlpha(TINTS[object.finish], 1);
  return (
    <>
      {[fit.cast, fit.contact].map((part, i) => (
        <ShadowCopy
          key={i === 0 ? "cast" : "contact"}
          image={image}
          transform={shadowTransform(cx, cy, r, fit.angle, part)}
          blur={part.blur * r}
          tint={tint}
          strength={part.a}
        />
      ))}
    </>
  );
}
