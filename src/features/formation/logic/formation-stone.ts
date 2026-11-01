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
 * - `facets`: a few big, soft masses — its face cut into just a handful of
 *   cells, each tipped a little its own way, soft ridges and valleys where
 *   they meet — so it reads as a few pieces pressed together, never lumpy.
 * - `folds`: a soft valley running in from each inward turn of its outline
 *   (a heart's cleft, between fingers, a star's inner corners).
 *
 * Its surface: `undulation`, a faint unevenness; `weave`, the linen it was
 * pressed against — its main texture, all over it — threads at a seeded
 * angle, `every` apart, each a little `uneven`, raised `depth`, broken up in
 * places (`broken`), its rows running one way and the threads `across` them
 * fainter, so it reads as rows of short dashes; `pocks`, tiny dark specks
 * sitting in the weave's pits.
 *
 * Its wear, placed by rule in any outline: one `crack`, a hairline running
 * in from its edge on the shaded side, nearly straight, a pale `ledge`
 * beside it where one side stands a hair higher; `cuts`, short, near
 * straight nicks meeting at angles — some off the crack, most on the shaded
 * side — with tiny dark `wedges` chipped out along them; `creases`, a few
 * hairlines along its facets' seams; `chips` knocked off its edge on the
 * shaded side, each a sloping broken face; a small `gouge` with a raised
 * rim; a shallow `dent`.
 *
 * Its icon: one that's a single solid (a heart) is the stone's outline; one
 * in pieces (a face in its frame) shapes a stone round all of it and is
 * `carve`d into it — its strokes at `fit` of the stone's size, cut `width`
 * wide and `depth` deep, softened (`soft`), grimed (`grime`). Either way the
 * stone's furthest point is `reach` from its middle.
 *
 * Its colour, measured off its reference: a putty stone (its middle tone
 * #BCA993, lit), never white; broad, irregular `patches` of tone — cream
 * where it's chalky or worn clean, putty, a dusky grey-brown — some
 * soft-edged, some crisp, like layers of plaster; a faint `mottle` and
 * `speckle`; warm `grime` along its crack and cuts, in its seams, chips and
 * gouge and round its edge, and big rubbed `smudges` of it, mostly on its
 * lower left, where the weave fills with it (and faintly everywhere,
 * `haze`); and a couple of irregular orange-red `flecks`, one smeared. Its
 * darkest is a warm brown, never near black.
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
  facets: { perArea: 3, fewest: 3, most: 4, tip: 0.22, soft: 0.08, seam: 0.09, ridge: 0.5 },
  folds: { span: 0.025, least: 0.02, length: [0.2, 0.45], width: 0.12, depth: 0.2, most: 5 },
  undulation: { fine: 2.6, depth: 0.015 },
  weave: {
    every: 0.042,
    thread: 0.016,
    depth: 0.012,
    broken: 9,
    uneven: 0.12,
    across: 0.35,
    grime: 0.3,
    haze: 0.07,
  },
  pocks: { count: 200, r: [0.002, 0.006], depth: 0.03, grime: 0.45 },
  outline: { wobble: 0.022, points: 140 },
  crack: {
    length: [0.7, 1.1],
    width: 0.008,
    depth: 0.18,
    ledge: { offset: 0.012, width: 0.01, rise: 0.12 },
    grime: { width: 0.018, strength: 0.4 },
    walk: { joints: 18, wander: 0.25, jitter: 0.006 },
  },
  cuts: {
    count: [18, 28],
    length: [0.05, 0.14],
    width: 0.006,
    depth: 0.12,
    branch: 0.1,
    shaded: 0.65,
    grime: 0.32,
    walk: { joints: 3, wander: 1.2, jitter: 0 },
  },
  wedges: { count: [6, 10], size: [0.015, 0.03], depth: 0.15, grime: 0.45 },
  creases: {
    count: [2, 4],
    length: [0.12, 0.32],
    width: 0.008,
    depth: 0.06,
    walk: { joints: 8, wander: 0.5, jitter: 0.008 },
  },
  chips: { count: 3, size: [0.2, 0.32], depth: 0.18, soft: 0.02 },
  gouge: {
    length: [0.06, 0.09],
    width: 0.03,
    lumps: 0.25,
    depth: 0.3,
    rim: { width: 0.014, rise: 0.1 },
    wide: 0.1,
    grime: 0.3,
  },
  dents: { count: 1, r: [0.14, 0.22], depth: 0.05, wide: 0.12 },
  flecks: { count: 2, r: [0.016, 0.026], lumps: 0.5, smear: 2.2 },
  mottle: { fine: 1.6, strength: 0.2, from: 0.5 },
  speckle: { fine: 20, strength: 0.25, from: 0.62 },
  patches: {
    count: [10, 16],
    r: [0.1, 0.38],
    lumps: 0.55,
    soft: [0.01, 0.06],
    strength: [0.5, 0.9],
    /** Of every patch, how many are cream, then putty; the rest dusk. */
    cream: 0.5,
    putty: 0.35,
  },
  grime: { edge: 0.12, edgeStrength: 0.12, line: 0.05, lineStrength: 0.25, seamStrength: 0.1 },
  carve: { reach: 1.08, fit: 0.72, width: 0.075, depth: 0.24, soft: 0.02, grime: 0.4 },
  smudges: {
    count: [3, 5],
    r: [0.15, 0.3],
    lumps: 0.5,
    soft: 0.1,
    strength: 0.45,
    streak: [3, 14],
  },
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
