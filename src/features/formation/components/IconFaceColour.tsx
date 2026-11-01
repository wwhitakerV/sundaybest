import { Group, Path } from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import type { IdealObject } from "../logic/formation-ideal";
import { ICON_FACE, iconFaceOf, iconFaceTransformOf } from "../logic/formation-icon-faces";
import { iconFaceShapeOf } from "./icon-face";

export type IconFaceColourProps = { object: IdealObject; centre: number; r: number };

/**
 * The colours an icon brings to its face: a flat puck's channels its
 * deeper red; an inlay's recess its dark red, its strokes white. The cream faces
 * take none: their icons show by their shape alone.
 */
export function IconFaceColour({ object, centre, r }: IconFaceColourProps) {
  const kind = iconFaceOf(object);
  const face = object.icon && iconFaceShapeOf(object.icon);
  if (!face || (kind !== "dish" && kind !== "inlay")) return null;
  return (
    <Group transform={iconFaceTransformOf(kind, centre, r)}>
      {kind === "dish" && (
        <Path
          path={face.shape.strokes}
          style="stroke"
          strokeWidth={ICON_FACE.dish.channel.width}
          strokeCap="round"
          strokeJoin="round"
          color={FORMATION_MATERIALS.red.shade}
        />
      )}
      {kind === "inlay" && (
        <>
          <Path path={face.recess} color={FORMATION_INLAY.recess} />
          <Path
            path={face.shape.strokes}
            style="stroke"
            strokeWidth={ICON_FACE.inlay.ridge.width}
            strokeCap="round"
            strokeJoin="round"
            color={FORMATION_INLAY.check}
          />
        </>
      )}
    </Group>
  );
}
