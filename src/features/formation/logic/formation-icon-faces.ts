import type { IdealObject } from "./formation-ideal";

/**
 * How a lucide icon is set into each kind of face, whatever the icon —
 * from its silhouette, its inner lines and its strokes (`icon-shape`):
 * - `engraved`, a cream dome: its silhouette sunk as a shallow dish, its
 *   outline and inner lines engraved, soft folds round it (`folds`).
 * - `plaque`, a cream dome's plaque: its silhouette raised off it, its
 *   inner lines cut in.
 * - `dish`, a red flat puck: its strokes sunk as soft, shallow channels
 *   (`channel`), in a deeper red — its silhouette filled would lose the
 *   drawing (a flexed arm reads as a heart).
 * - `inlay`, a red rounded puck: a dark recess cut to its silhouette
 *   widened (`pad`), its strokes inlaid in white, standing a little proud.
 * The sculpted ball and the stone sculpt have their own
 * (`formation-sculpted-ball`, `formation-stone`).
 *
 * `fit` is the icon's half-width on the face, of the face's radius; every
 * other size is in the icon's own units (its half-width 1); depths and
 * heights are shares of the height map's range. Read off the references'
 * eye, almond, mouth and shield.
 */
export const ICON_FACE = {
  engraved: {
    fit: 0.56,
    sunk: 0.22,
    soft: 0.06,
    groove: { width: 0.12, depth: 0.3, soft: 0.045 },
    folds: {
      /** The fold's crest, round the icon at this scale of it, how wide and soft, how high. */
      crest: { scale: 1.3, width: 0.4, soft: 0.24, height: 0.1 },
      /** The face sinking softly into the icon along its outline. */
      socket: { width: 0.45, soft: 0.2, depth: 0.2 },
      /** Both fading from its left to its right, toward the light: what's left there. */
      fade: 0.3,
    },
  },
  plaque: { fit: 0.38, raised: 0.22, soft: 0.06, groove: { width: 0.1, depth: 0.3, soft: 0.04 } },
  dish: { fit: 0.5, channel: { width: 0.26, depth: 0.16, soft: 0.05 } },
  inlay: {
    fit: 0.34,
    pad: 0.16,
    sunk: 0.26,
    soft: 0.06,
    ridge: { width: 0.17, height: 0.16, soft: 0.04 },
  },
} as const;

export type IconFace = keyof typeof ICON_FACE;

/** How an object's icon is set into its face, or none: the sculpted ball and the sculpt have their own. */
export function iconFaceOf(object: IdealObject): IconFace | null {
  if (!object.icon) return null;
  if (object.form === "dome") return object.plaque ? "plaque" : "engraved";
  if (object.form === "puck") return object.rounded ? "inlay" : "dish";
  return null;
}

/** Where an icon's own units sit on a face of radius `r` centred at `centre`. */
export function iconFaceTransformOf(face: IconFace, centre: number, r: number) {
  return [{ translateX: centre }, { translateY: centre }, { scale: ICON_FACE[face].fit * r }];
}
