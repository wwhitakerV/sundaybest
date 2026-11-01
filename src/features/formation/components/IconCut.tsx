import { BlurMask, Group, Path } from "@shopify/react-native-skia";

import type { IdealObject } from "../logic/formation-ideal";
import { iconFaceOf, iconFaceTransformOf } from "../logic/formation-icon-faces";
import { greyOf } from "./ideal-paint";
import { iconFaceShapeOf } from "./icon-face";

export type IconCutProps = {
  object: IdealObject;
  centre: number;
  r: number;
  /** How soft its edge (in the icon's own units). */
  soft: number;
};

/**
 * The object's icon on its face — its silhouette, or an inlay's recess —
 * taken back out of whatever's drawn before it in the same layer, so a
 * texture or a sheen stops at the icon.
 */
export function IconCut({ object, centre, r, soft }: IconCutProps) {
  const kind = iconFaceOf(object);
  const face = object.icon && iconFaceShapeOf(object.icon);
  if (!kind || !face) return null;
  return (
    <Group transform={iconFaceTransformOf(kind, centre, r)}>
      <Path
        path={kind === "inlay" ? face.recess : face.shape.mass}
        color={greyOf(0, 1)}
        blendMode="dstOut"
      >
        <BlurMask blur={soft} style="normal" />
      </Path>
    </Group>
  );
}
