/** A letter at one moment: how far it has fallen, its tilt, and how it's drawn. */
export type LetterState = {
  /** How far it has fallen, in points. */
  dy: number;
  /** Its tilt, in degrees, about its own centre (`cx`, in wordmark units). */
  rot: number;
  cx: number;
  /** Reaching the pool: drawn as part of the water's liquid, so it merges into it. */
  liquid: boolean;
  visible: boolean;
};

/** A crisp drop: hanging from a letter, falling, the stub it leaves, or a round bead. */
export type Tear =
  | { kind: "hang"; x: number; y0: number; r: number; g: number }
  | { kind: "fall"; x: number; cy: number; r: number; s: number }
  | { kind: "stub"; x: number; y0: number; r: number; k: number }
  | { kind: "round"; x: number; cy: number; r: number };

/** Everything to draw at one moment of the intro. */
export type Frame = {
  /** Each pen line's progress, 0–1, in writing order. */
  strokes: number[];
  /** Each letter's fill coming in under its pen lines once they're done, 0–1. */
  inks: number[];
  /** The pen is still writing: the letters are drawn through their pen lines. */
  writing: boolean;
  letters: LetterState[];
  /** The liquid's loose drops, as capsules: [centre x, top, bottom, width, …]. */
  blobs: number[];
  tears: Tear[];
  /** The water's edge, left to right: [x, y, …]; empty when there's no water. */
  edge: number[];
  /** The screen is full colour from edge to edge. */
  allRed: boolean;
  /** The blank beat before the pen: nothing shows, but the liquid's filter is put to work once. */
  warming: boolean;
};
