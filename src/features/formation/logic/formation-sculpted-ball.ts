import type { FormationIcon } from "./formation-icons";

/**
 * The sculpted ball: a red ball with a lucide icon modelled up out of it, as
 * the reference's brain is — whatever the icon. Read off the reference.
 *
 * The icon (`ICON_RELIEF`), in shares of its own half-width:
 * - `fit`: its half-width on the ball, a share of the ball's radius — the
 *   reference's brain is about four-fifths of its ball across; ours a little
 *   less, so the ball shows round it and its wear has room.
 * - `mass`: its silhouette — its strokes merged, their holes filled — raised
 *   off the ball: a tall, near-upright side first, so it stands up as a lump
 *   and its top edge catches the light, then swelling plumper inward.
 * - `crease`: the narrow crease all round its foot, where it meets the ball
 *   — the finish turns it near black — and `halo`, the ball darkened a little
 *   just outside it, in its shade.
 * - `grooves`: its strokes inside that silhouette, cut in as folds — a wide,
 *   shallow channel with a deeper core, fading out toward each end, slightly
 *   wandering — with a soft `lip` swelling up either side of each.
 * - `branches` and `free`: for an icon whose subject is itself folded
 *   (`FOLDED`: the brain), finer winding folds — off each groove, and
 *   through its plain parts — for the reference's many small folds: each a
 *   soft, wide hollow with a narrow dark core, so the clay between them
 *   rounds plump; kept `apart` from the rest and `inside` its silhouette;
 *   how many hangs on its area. Every other icon is modelled clean, its own
 *   lines its only folds. A `busy` icon (more groove than room) has its
 *   grooves held shallower.
 * - `lobes`: a folded icon's outline, lumpy — a lobe swelling out every so
 *   often along it, and between some (`notched`) of them a short, shallower
 *   (`depth`, of a fine fold's) fold notching in from the edge.
 * - `inner`: how far inside its silhouette a stroke must lie to be a groove
 *   (its outline strokes are its edge).
 *
 * The ball round it (`RING_WEAR`), in shares of the ball's radius: seeded
 * `strips` of crumbling damage spread right round the ring between the icon
 * and the ball's edge, none of it left bare for long — some along the icon's
 * foot — each a shallow, rougher patch packed with `marks`: specks, chips
 * knocked out and short tears, filled with near-black `grime`. Sized to show
 * at the board's size. Over it all, `pores`: the velvet tooth of its
 * soft-touch red, and a faint paler speckle.
 */

export const ICON_RELIEF = {
  fit: 0.7,
  mass: [
    { erode: 0, soft: 0.012, height: 0.18 },
    { erode: 0.05, soft: 0.06, height: 0.07 },
    { erode: 0.12, soft: 0.12, height: 0.06 },
    { erode: 0.22, soft: 0.18, height: 0.05 },
    { erode: 0.35, soft: 0.25, height: 0.05 },
    { erode: 0.5, soft: 0.3, height: 0.04 },
  ],
  crease: { width: 0.03, depth: 0.25, soft: 0.01 },
  halo: { width: 0.16, strength: 0.18 },
  grooves: { width: 0.17, depth: 0.32, core: 0.06, coreDepth: 0.3, taper: 0.28, wander: 0.005 },
  lip: { width: 0.4, rise: 0.035, soft: 0.07 },
  branches: {
    perLength: 1.2,
    length: [0.2, 0.45],
    width: 0.15,
    depth: 0.2,
    core: 0.035,
    coreDepth: 0.32,
    walk: { joints: 10, wander: 1.4, jitter: 0.012 },
  },
  free: { perArea: 4, length: [0.3, 0.7] },
  lobes: { every: 0.2, r: [0.06, 0.09], out: 0.035, notch: [0.08, 0.16], notched: 0.5, depth: 0.7 },
  /** How close one fold may run to another (and stay well inside: `inside`). */
  apart: 0.1,
  inside: 0.05,
  busy: 2.6,
  inner: 0.16,
} as const;

/** The icons whose subject is itself folded: they take the fine folds and the lumpy outline. */
export const FOLDED: readonly FormationIcon[] = ["brain"];

export const RING_WEAR = {
  /** How many, spread evenly round with a little give (`jitter`, of the gap between them). */
  strips: {
    count: [6, 7],
    jitter: 0.15,
    length: [0.2, 0.35],
    walk: { joints: 10, wander: 0.5, jitter: 0.01 },
    width: 0.05,
    depth: 0.06,
    tint: 0.22,
  },
  /** Where in the ring: `atIcon` of the strips along the icon's foot, the rest out in the ring, inside `edge`. */
  edge: 0.92,
  atIcon: 0.4,
  marks: { count: [25, 45], spread: 0.03, specks: 0.45, chips: 0.2 },
  specks: { r: [0.004, 0.009], depth: 0.3 },
  chips: { r: [0.006, 0.014], lumps: 0.5, depth: 0.35, soft: 0.004 },
  tears: {
    length: [0.03, 0.07],
    width: 0.007,
    depth: 0.55,
    walk: { joints: 4, wander: 0.8, jitter: 0.004 },
  },
  grime: { width: 1.2, strength: 0.85 },
  pores: { fine: 70, depth: 0.025, speckle: 0.5, from: 0.6 },
} as const;
