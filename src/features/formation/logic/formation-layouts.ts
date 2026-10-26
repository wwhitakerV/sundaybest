import form4 from "../../../../assets/formation/white/form-4.jpeg";
import form5 from "../../../../assets/formation/white/form-5.jpeg";
import form6 from "../../../../assets/formation/white/form-6.jpeg";
import form7 from "../../../../assets/formation/white/form-7.jpeg";
import form8 from "../../../../assets/formation/white/form-8.jpeg";

/**
 * Each version of Formation (v4–v8, after its artwork form-4…8 — lifted onto
 * white, `npm run build:formation` — vLine, its pathway one fine line, and
 * vIdeal, its reference drawn whole), fitted to its own artwork. In shares of the
 * stage (the reference's own shape): where the artwork sits and how wide —
 * scaled, its proportions kept (`ratio`, height over width), so its ribbon's
 * tip and tail land where the reference's do — and each stop's centre
 * across, on that ribbon's own line at the reference's heights.
 *
 * Each was measured: its ribbon's centre line traced row by row from its
 * image, then the
 * reference's zig-zag either side of the line kept — the brain then set on
 * the ribbon's left third by eye, where its shadow pulled the trace left.
 */
/** Where a version's stops sit across: one centre to each, top to bottom. */
type Stops = readonly [number, number, number, number, number];

export type FormationLayout =
  | {
      /** Its name in the menu: its artwork's number (form-4 is v4). */
      id: string;
      kind: "art";
      art: number;
      ratio: number;
      ribbon: { x: number; y: number; w: number };
      stops: Stops;
    }
  | {
      /**
       * vLine, after its own reference: no artwork — one fine line through
       * its stops, the icons on it at their own sizes and places, lit from
       * the top right; nothing else. Its places are shares of its own board,
       * the reference's shape (`aspect`, width over height).
       */
      id: string;
      kind: "line";
      aspect: number;
      /** Each stop's centre and its disc's width (a share of the board's width), top to bottom. */
      spots: readonly { x: number; y: number; d: number }[];
      /** The line's way through and past them, top to bottom. */
      path: readonly { x: number; y: number }[];
      /** The stop in hand, glowing. */
      now: number;
    }
  | {
      /**
       * vIdeal, its reference redrawn whole — objects, shadows, pencil and
       * threads — on its own paper, under a header in the reference's style.
       * Its places are its own data (`formation-ideal.ts`).
       */
      id: string;
      kind: "ideal";
    }
  | {
      /**
       * vIdeal 2: vIdeal's board as a track, moved by a finger — each object
       * riding up into the eye's place, its lines drawing with it, its words
       * and a ticker beside it (`formation-track.ts`).
       */
      id: string;
      kind: "track";
    };

export const FORMATION_LAYOUTS: readonly FormationLayout[] = [
  {
    id: "4",
    kind: "art",
    art: form4,
    ratio: 1856 / 866,
    ribbon: { x: -0.06, y: 0.033, w: 0.954 },
    stops: [0.468, 0.431, 0.668, 0.459, 0.373],
  },
  {
    id: "5",
    kind: "art",
    art: form5,
    ratio: 1933 / 832,
    ribbon: { x: 0, y: 0.06, w: 0.866 },
    stops: [0.51, 0.4, 0.638, 0.47, 0.396],
  },
  {
    id: "6",
    kind: "art",
    art: form6,
    ratio: 2025 / 884,
    ribbon: { x: 0.056, y: 0.073, w: 0.843 },
    stops: [0.556, 0.4, 0.636, 0.472, 0.37],
  },
  {
    id: "7",
    kind: "art",
    art: form7,
    ratio: 2079 / 983,
    ribbon: { x: 0.006, y: 0.053, w: 0.954 },
    stops: [0.496, 0.43, 0.676, 0.573, 0.341],
  },
  {
    id: "8",
    kind: "art",
    art: form8,
    ratio: 2157 / 1029,
    ribbon: { x: -0.023, y: 0.063, w: 0.954 },
    stops: [0.495, 0.38, 0.67, 0.555, 0.38],
  },
  {
    id: "Line",
    kind: "line",
    // Measured from its reference (423 × 830): its icons' discs, and its line's way.
    aspect: 423 / 830,
    spots: [
      { x: 0.284, y: 0.086, d: 0.251 },
      { x: 0.697, y: 0.295, d: 0.274 },
      { x: 0.492, y: 0.5, d: 0.118 },
      { x: 0.296, y: 0.598, d: 0.241 },
      { x: 0.314, y: 0.829, d: 0.241 },
    ],
    path: [
      { x: 0.284, y: 0.086 },
      { x: 0.39, y: 0.116 },
      { x: 0.499, y: 0.154 },
      { x: 0.634, y: 0.231 },
      { x: 0.697, y: 0.295 },
      { x: 0.681, y: 0.365 },
      { x: 0.626, y: 0.424 },
      { x: 0.544, y: 0.476 },
      { x: 0.492, y: 0.5 },
      { x: 0.402, y: 0.548 },
      { x: 0.296, y: 0.598 },
      { x: 0.26, y: 0.66 },
      { x: 0.236, y: 0.723 },
      { x: 0.255, y: 0.771 },
      { x: 0.314, y: 0.829 },
      { x: 0.378, y: 0.886 },
      { x: 0.501, y: 0.936 },
      { x: 0.709, y: 0.97 },
      { x: 0.856, y: 0.99 },
    ],
    now: 1,
  },
  { id: "Ideal", kind: "ideal" },
  { id: "Ideal 2", kind: "track" },
];
