/**
 * The stone material, read off its reference (a chalky carved heart): what
 * any sculpt is made of, whatever icon gives it its shape. Every size is a
 * share of the sculpt's half-width, every depth a share of the height map's
 * range, so a small stone and a large one read alike.
 *
 * Its form, at three scales:
 * - `inflate`: the volume the outline is swelled into — the outline eaten
 *   back (`erode`) and softened (`soft`), at six depths, each rising less
 *   than the one before, so wide parts swell plump and narrow ones stay slim,
 *   every edge rolling softly down to the page.
 * - `facets`: broad, shallow carved planes — its face cut into cells (more
 *   for a larger stone), each tipped a little its own way, soft ridges and
 *   valleys where they meet.
 * - `folds`: a soft valley running in from each inward turn of its outline
 *   (a heart's cleft, between fingers, a star's inner corners).
 *
 * Its surface: `undulation`, a faint unevenness; `weave`, the fine crossed
 * grain of plaster pressed against linen, at a seeded angle; `pocks`, tiny
 * pits all over.
 *
 * Its wear, placed by rule in any outline: `cracks` wandering across its
 * widest parts (a fine split in a soft, shallow valley); `creases`, short
 * hairlines along its facets' seams; `chips` knocked off its edge on the
 * shaded side, each a sloping broken face; irregular `pits`; shallow `dents`.
 *
 * Its colour: the white stone, a faint `mottle` and `speckle` in its own
 * shade, the weave's dark flecks; pure white `bloom` patches — on its high
 * planes, along some ridges, and a few anywhere — where it's powdery or worn
 * clean; `grime` in its creases, seams, chips, pits and round its edge; a red
 * fleck or two.
 */
export const STONE = {
  inflate: [
    { erode: 0.03, soft: 0.1, height: 0.2 },
    { erode: 0.1, soft: 0.14, height: 0.2 },
    { erode: 0.19, soft: 0.18, height: 0.17 },
    { erode: 0.29, soft: 0.24, height: 0.15 },
    { erode: 0.4, soft: 0.3, height: 0.13 },
    { erode: 0.52, soft: 0.36, height: 0.11 },
  ],
  facets: { perArea: 10, fewest: 5, most: 9, tip: 0.18, soft: 0.05, seam: 0.05, ridge: 0.5 },
  folds: { span: 0.025, least: 0.02, length: [0.2, 0.45], width: 0.12, depth: 0.2, most: 5 },
  undulation: { fine: 2.6, depth: 0.03 },
  weave: { fine: 70, dash: 1.6, depth: 0.005, flecks: 0.8, from: 0.62 },
  pocks: { count: 120, r: [0.003, 0.007], depth: 0.1, grime: 0.18 },
  outline: { wobble: 0.022, points: 140 },
  cracks: {
    count: 1,
    length: [0.6, 1.1],
    width: 0.014,
    depth: 0.14,
    valley: { width: 0.1, depth: 0.05 },
    step: 0.025,
    wide: 0.07,
    walk: { joints: 18, wander: 0.7, jitter: 0.012 },
  },
  creases: {
    count: [4, 8],
    length: [0.12, 0.32],
    width: 0.008,
    depth: 0.06,
    walk: { joints: 8, wander: 0.5, jitter: 0.008 },
  },
  chips: { count: 3, size: [0.2, 0.32], depth: 0.18, soft: 0.02 },
  pits: { count: 2, r: [0.022, 0.04], lumps: 0.35, depth: 0.45, wide: 0.08 },
  dents: { count: 4, r: [0.12, 0.22], depth: 0.07, wide: 0.1 },
  flecks: { count: 2, r: [0.012, 0.018] },
  mottle: { fine: 1.6, strength: 0.5, from: 0.45 },
  speckle: { fine: 20, strength: 0.8, from: 0.58 },
  bloom: { count: [4, 7], r: [0.14, 0.32], lumps: 0.35, soft: 0.06, strength: 0.85, break: 7 },
  grime: { edge: 0.12, edgeStrength: 0.2, line: 0.05, lineStrength: 0.22, seamStrength: 0.08 },
} as const;

/** A stable number from `text` (FNV-1a): the same wear for the same icon, every time. */
export function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
