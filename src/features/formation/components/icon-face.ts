import { PathOp, Skia, StrokeJoin, type SkPath } from "@shopify/react-native-skia";

import type { FormationIcon } from "../logic/formation-icons";
import { ICON_FACE } from "../logic/formation-icon-faces";
import { iconShapeOf, type IconShape } from "./icon-shape";
import { polyline } from "./stone-paths";

/**
 * An icon ready to set into a face, in its own units: its shape, its inner
 * lines as one path, and the inlay's recess — its silhouette widened by the
 * inlay's `pad`, its holes filled.
 */
export type IconFaceShape = { shape: IconShape; lines: string; recess: SkPath };

const faces = new Map<FormationIcon, IconFaceShape | null>();

function recessOf(mass: SkPath): SkPath {
  const ring = Skia.Path.Stroke(mass, { width: ICON_FACE.inlay.pad * 2, join: StrokeJoin.Round });
  return (ring && Skia.Path.MakeFromOp(mass, ring, PathOp.Union)) ?? mass;
}

function faceOf(icon: FormationIcon): IconFaceShape | null {
  const shape = iconShapeOf(icon);
  if (!shape) return null;
  return {
    shape,
    lines: shape.lines.map((line) => polyline(line)).join(" "),
    recess: recessOf(shape.mass),
  };
}

/** `icon` ready to set into a face: worked out once, then kept. */
export function iconFaceShapeOf(icon: FormationIcon): IconFaceShape | null {
  if (!faces.has(icon)) faces.set(icon, faceOf(icon));
  return faces.get(icon) ?? null;
}
