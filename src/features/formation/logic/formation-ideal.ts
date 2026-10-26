/**
 * vIdeal, after its reference: every place measured off it, in shares of
 * the board's width (x and y both, so nothing is ever stretched), the board
 * starting just above the first object. Data only.
 */

type IdealFinish = "ceramic" | "red" | "stone";
/** What the object is: a domed ceramic button, a red puck (its side showing), a red ball, or the stone heart. */
type IdealForm = "dome" | "puck" | "ball" | "heart";
/** The lucide symbol set into its face, or the red eye's almond (lucide's eye, its outline only). */
export type IdealGlyph = "eye" | "almond" | "brain" | "mouth" | "shieldCheck";

export type IdealObject = {
  id: string;
  form: IdealForm;
  finish: IdealFinish;
  glyph?: IdealGlyph;
  /** A raised shield-shaped plaque the glyph sits on (the mouth's). */
  plaque?: boolean;
  /** A puck rounded over at its edge rather than cut square (the shield's). */
  rounded?: boolean;
  x: number;
  y: number;
  /** Its width. */
  d: number;
};

/**
 * The way the light falls at each station, top to bottom (degrees, screen
 * axes: 180 is straight left, 90 straight down): read off the reference's
 * shadows, fitted by least squares, one at each object's place. The light
 * is a large soft one close by, so it comes from a little further round at
 * each.
 */
export const STATION_LIGHT_ANGLES: readonly number[] = [145, 145.5, 148.5, 150, 136.5, 156.5];

type Point = { x: number; y: number };

/** The board's height, in shares of its width: from above the eye to below the heart. */
export const IDEAL_HEIGHT = 1.68;

export const IDEAL_OBJECTS: readonly IdealObject[] = [
  {
    id: "eye",
    form: "dome",
    finish: "ceramic",
    glyph: "eye",
    x: 0.697,
    y: 0.134,
    d: 0.157,
  },
  {
    id: "almond",
    form: "puck",
    finish: "red",
    glyph: "almond",
    x: 0.777,
    y: 0.356,
    d: 0.189,
  },
  {
    id: "brain",
    form: "ball",
    finish: "red",
    glyph: "brain",
    x: 0.628,
    y: 0.639,
    d: 0.217,
  },
  {
    id: "mouth",
    form: "dome",
    finish: "ceramic",
    glyph: "mouth",
    plaque: true,
    x: 0.403,
    y: 0.922,
    d: 0.227,
  },
  {
    id: "shield",
    form: "puck",
    finish: "red",
    glyph: "shieldCheck",
    rounded: true,
    x: 0.53,
    y: 1.187,
    d: 0.227,
  },
  { id: "heart", form: "heart", finish: "stone", x: 0.505, y: 1.48, d: 0.227 },
];

const at = (pairs: readonly (readonly [number, number])[]): Point[] =>
  pairs.map(([x, y]) => ({ x, y }));

/** The pencil lines, traced off the reference: most sweep down the left of the objects, a few cross between them. */
export const IDEAL_STRANDS: readonly Point[][] = [
  at([
    [0.623, 0.177],
    [0.63, 0.253],
    [0.614, 0.32],
    [0.589, 0.354],
  ]),
  at([
    [0.783, 0.181],
    [0.81, 0.215],
    [0.829, 0.253],
  ]),
  at([
    [0.652, 0.271],
    [0.692, 0.279],
  ]),
  at([
    [0.812, 0.497],
    [0.795, 0.535],
    [0.762, 0.577],
    [0.741, 0.589],
  ]),
  at([
    [0.438, 0.539],
    [0.471, 0.509],
    [0.509, 0.484],
    [0.551, 0.459],
  ]),
  at([
    [0.53, 0.505],
    [0.547, 0.539],
  ]),
  at([
    [0.303, 0.724],
    [0.253, 0.758],
    [0.221, 0.783],
    [0.227, 0.817],
  ]),
  at([
    [0.455, 0.61],
    [0.421, 0.665],
    [0.391, 0.707],
    [0.354, 0.741],
    [0.303, 0.783],
    [0.253, 0.816],
    [0.21, 0.867],
    [0.177, 0.926],
    [0.156, 1.002],
    [0.143, 1.077],
    [0.126, 1.145],
    [0.135, 1.195],
    [0.173, 1.254],
  ]),
  at([
    [0.362, 0.673],
    [0.337, 0.774],
    [0.32, 0.825],
  ]),
  at([
    [0.383, 0.753],
    [0.32, 0.8],
    [0.261, 0.85],
    [0.227, 0.926],
    [0.219, 0.993],
    [0.231, 1.061],
    [0.253, 1.145],
    [0.253, 1.271],
    [0.278, 1.33],
    [0.303, 1.368],
    [0.337, 1.423],
  ]),
  at([
    [0.125, 1.01],
    [0.116, 1.077],
    [0.118, 1.145],
    [0.126, 1.212],
  ]),
  at([
    [0.522, 0.926],
    [0.543, 0.976],
    [0.53, 1.027],
  ]),
  at([
    [0.505, 0.846],
    [0.539, 0.833],
    [0.577, 0.808],
  ]),
  at([
    [0.189, 1.103],
    [0.219, 1.111],
    [0.253, 1.094],
    [0.282, 1.077],
  ]),
  at([
    [0.354, 1.094],
    [0.379, 1.12],
    [0.412, 1.136],
  ]),
  at([
    [0.223, 1.145],
    [0.226, 1.221],
  ]),
  at([
    [0.21, 1.347],
    [0.253, 1.389],
    [0.286, 1.423],
    [0.354, 1.456],
    [0.383, 1.465],
  ]),
  at([
    [0.316, 1.439],
    [0.337, 1.507],
    [0.379, 1.557],
    [0.429, 1.587],
  ]),
  at([
    [0.606, 1.305],
    [0.623, 1.355],
    [0.619, 1.397],
  ]),
];

/** The red threads from one object to the next, each a slight curve through its middle point, and its weight (points). */
export const IDEAL_CONNECTORS: readonly { points: Point[]; width: number }[] = [
  {
    points: at([
      [0.745, 0.21],
      [0.757, 0.231],
      [0.768, 0.251],
    ]),
    width: 0.8,
  },
  {
    points: at([
      [0.716, 0.503],
      [0.712, 0.521],
      [0.705, 0.539],
    ]),
    width: 1,
  },
  {
    points: at([
      [0.425, 0.755],
      [0.42, 0.778],
      [0.412, 0.8],
    ]),
    width: 0.8,
  },
  {
    points: at([
      [0.407, 1.035],
      [0.425, 1.07],
      [0.455, 1.101],
    ]),
    width: 1.8,
  },
];

/** The small red dots scattered on the paper, and their radii. */
export const IDEAL_DOTS: readonly (Point & { r: number })[] = [
  { x: 0.303, y: 0.724, r: 0.006 },
  { x: 0.534, y: 0.848, r: 0.004 },
  { x: 0.282, y: 1.077, r: 0.006 },
  { x: 0.625, y: 1.09, r: 0.003 },
  { x: 0.44, y: 1.349, r: 0.005 },
  { x: 0.606, y: 1.309, r: 0.004 },
  { x: 0.401, y: 1.55, r: 0.005 },
  { x: 0.457, y: 1.578, r: 0.003 },
];

/** Where the reference's labels were, now line art: from `x` to `to`, red or pencil, a dash leading in when it had one. */
export const IDEAL_ACCENTS: readonly {
  x: number;
  to: number;
  y: number;
  tone: "red" | "graphite";
  lead?: boolean;
}[] = [
  { x: 0.665, to: 0.871, y: 0.486, tone: "red" },
  { x: 0.8, to: 0.896, y: 0.644, tone: "red" },
  { x: 0.362, to: 0.442, y: 0.64, tone: "graphite", lead: true },
  { x: 0.505, to: 0.703, y: 0.787, tone: "red", lead: true },
  { x: 0.147, to: 0.221, y: 0.918, tone: "graphite", lead: true },
  { x: 0.572, to: 0.661, y: 0.92, tone: "red", lead: true },
  { x: 0.244, to: 0.358, y: 1.183, tone: "graphite" },
  { x: 0.665, to: 0.711, y: 1.452, tone: "graphite", lead: true },
];
