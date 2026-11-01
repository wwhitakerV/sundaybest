import type { FormationIcon } from "../logic/formation-icons";
import { FOLDED } from "../logic/formation-sculpted-ball";
import { seedOf } from "../logic/formation-stone";
import { iconFoldsOf, type IconFolds } from "./icon-folds";
import { lobesOf } from "./icon-lobes";
import { iconShapeOf, type IconShape } from "./icon-shape";
import { ringWearOf, type RingWear } from "./ring-wear";

/**
 * Everything a sculpted ball is modelled from: its icon's shape and the
 * outline it's raised from (lumpy, if it's folded), the folds cut into it,
 * the wear round it.
 */
export type SculptedBall = { shape: IconShape; outline: string; folds: IconFolds; wear: RingWear };

function ballOf(icon: FormationIcon, shape: IconShape): SculptedBall {
  const seed = seedOf(icon);
  const folded = FOLDED.includes(icon);
  const folds = iconFoldsOf(shape, folded, seed);
  const wear = ringWearOf(shape, seed + 1);
  if (!folded) return { shape, outline: shape.outline, folds, wear };
  const lobes = lobesOf(shape, seed + 2);
  return {
    shape,
    outline: lobes.outline,
    folds: { ...folds, fine: [...folds.fine, ...lobes.notches] },
    wear,
  };
}

const balls = new Map<FormationIcon, SculptedBall | null>();

/** `icon`'s sculpted ball, worked out once and kept: its height and colour maps both draw from it. */
export function sculptedBallOf(icon: FormationIcon): SculptedBall | null {
  if (!balls.has(icon)) {
    const shape = iconShapeOf(icon);
    balls.set(icon, shape && ballOf(icon, shape));
  }
  return balls.get(icon) ?? null;
}
