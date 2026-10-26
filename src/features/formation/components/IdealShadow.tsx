import { FORMATION_PAPER } from "@/theme";
import { IDEAL_OBJECTS, type IdealObject } from "../logic/formation-ideal";
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
};

/**
 * What a still object throws onto the page, at its own station's height and
 * in its light (`shadowAt`): its cast shadow, drawn out along the way the
 * light falls, and its contact shadow at its foot — each multiplied into
 * the page in its finish's measured tint.
 */
export function IdealShadow({ object, cx, cy, diameter }: IdealShadowProps) {
  const r = diameter / 2;
  const fit = shadowAt(IDEAL_OBJECTS.indexOf(object), object.d / 2);
  const tint = TINTS[object.finish];
  return (
    <>
      {[fit.cast, fit.contact].map((part, i) => (
        <ShadowCopy
          key={i === 0 ? "cast" : "contact"}
          heart={object.form === "heart"}
          transform={shadowTransform(cx, cy, r, fit.angle, part)}
          blur={part.blur / part.s}
          colour={withAlpha(tint, part.a)}
        />
      ))}
    </>
  );
}
