import { BlurMask, Group, Path, type SkPath } from "@shopify/react-native-skia";

import type { IdealObject } from "../logic/formation-ideal";
import { ICON_FACE, iconFaceOf, iconFaceTransformOf } from "../logic/formation-icon-faces";
import { greyOf } from "./ideal-paint";
import { iconFaceShapeOf, type IconFaceShape } from "./icon-face";
import { IconFolds } from "./IconFolds";

const line = { style: "stroke", strokeCap: "round", strokeJoin: "round" } as const;
const up = (a: number) => greyOf(1, a);
const down = (a: number) => greyOf(0, a);

/** A shape sunk `depth` into the face, its edge softened. */
function Sunk({ path, depth, soft }: { path: SkPath | string; depth: number; soft: number }) {
  return (
    <Path path={path} color={down(depth)}>
      <BlurMask blur={soft} style="normal" />
    </Path>
  );
}

/** Lines cut `depth` into the face. */
function Grooves({
  path,
  groove,
}: {
  path: string;
  groove: { width: number; depth: number; soft: number };
}) {
  if (!path) return null;
  return (
    <Path path={path} {...line} strokeWidth={groove.width} color={down(groove.depth)}>
      <BlurMask blur={groove.soft} style="normal" />
    </Path>
  );
}

/** A cream dome's engraving: folds round it, its silhouette a shallow dish, its outline and inner lines cut in. */
function Engraved({ face }: { face: IconFaceShape }) {
  const { sunk, soft, groove } = ICON_FACE.engraved;
  return (
    <>
      <IconFolds outline={face.shape.outline} />
      <Sunk path={face.shape.mass} depth={sunk} soft={soft} />
      <Grooves path={face.shape.outline} groove={groove} />
      <Grooves path={face.lines} groove={groove} />
    </>
  );
}

/** On a plaque: its silhouette raised, its inner lines cut in. */
function Raised({ face }: { face: IconFaceShape }) {
  const { raised, soft, groove } = ICON_FACE.plaque;
  return (
    <>
      <Path path={face.shape.mass} color={up(raised)} blendMode="plus">
        <BlurMask blur={soft} style="normal" />
      </Path>
      <Grooves path={face.lines} groove={groove} />
    </>
  );
}

/** A red flat puck's dish: its strokes sunk as soft, shallow channels. */
function Dish({ face }: { face: IconFaceShape }) {
  const { channel } = ICON_FACE.dish;
  return <Grooves path={face.shape.strokes} groove={channel} />;
}

/** A red rounded puck's inlay: a recess cut to its widened silhouette, its strokes standing in it. */
function Inlay({ face }: { face: IconFaceShape }) {
  const { sunk, soft, ridge } = ICON_FACE.inlay;
  return (
    <>
      <Sunk path={face.recess} depth={sunk} soft={soft} />
      <Path
        path={face.shape.strokes}
        {...line}
        strokeWidth={ridge.width}
        color={up(ridge.height)}
        blendMode="plus"
      >
        <BlurMask blur={ridge.soft} style="normal" />
      </Path>
    </>
  );
}

const FACES = { engraved: Engraved, plaque: Raised, dish: Dish, inlay: Inlay };

export type IconFaceHeightProps = { object: IdealObject; centre: number; r: number };

/** An object's icon set into its face, in its height map, by its kind (`ICON_FACE`). */
export function IconFaceHeight({ object, centre, r }: IconFaceHeightProps) {
  const kind = iconFaceOf(object);
  const face = object.icon && iconFaceShapeOf(object.icon);
  if (!kind || !face) return null;
  const Face = FACES[kind];
  return (
    <Group transform={iconFaceTransformOf(kind, centre, r)}>
      <Face face={face} />
    </Group>
  );
}
