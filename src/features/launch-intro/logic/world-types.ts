/** A drop knocked up out of the pool by a drip landing. */
type Kick = { vx: number; h: number; r: number; delay: number };

/** One drip: swelling from `tb`, letting go at `td`, landing in the pool at `th`. */
export type Drip = {
  tb: number;
  td: number;
  th: number;
  x: number;
  r: number;
  /** It sheds a tiny second drop as its neck snaps. */
  satellite: boolean;
  kick: Kick[];
};

/** A letter falling into the pool: it reaches the water at `hit` and is all water by `gone`. */
export type Fall = { start: number; hit: number; gone: number; rot: number; cx: number; x: number };

/** Something landing in the pool, and the ripples it sends out. */
export type Impact = { t: number; x: number; amp: number; w: number };

/** The water heaving up where a letter pours in. */
export type Heave = { t: number; x: number; A: number; w: number };

/** A drop thrown up by a letter landing. */
export type Spray = { t0: number; y0: number; x: number; vx: number; vy: number; r: number };

type EdgeDrop = { x: number; at: number; up: number; vx: number; r: number };
type Strand = {
  x: number;
  ang: number;
  v: number;
  dt: number;
  beads: { k: number; r: number }[];
};
type JetDrop = { dx: number; dt: number; v: number; r: number };

/** Everything that happens after the pen, worked out once and then only read. */
export type World = {
  /** Points per wordmark unit. */
  ws: number;
  cx: number;
  cy: number;
  /** Where drips hang from: the letters' bottom edge, in points. */
  yb: number;
  /** Drips, in the order they let go. */
  drips: Drip[];
  /** Pool height per unit of landed drip volume. */
  perVolume: number;
  falls: Fall[];
  impacts: Impact[];
  heaves: Heave[];
  spray: Spray[];
  sheetPhase: number[];
  splash: { edge: EdgeDrop[]; strands: Strand[]; jet: JetDrop[] };
};
