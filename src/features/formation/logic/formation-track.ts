import { IDEAL_HEIGHT, IDEAL_OBJECTS } from "./formation-ideal";

type Point = { x: number; y: number };

/**
 * vIdeal 2's track: one curve through the places vIdeal's objects sit (its
 * stations, in shares of the board's width), running on above the first,
 * off the top of the screen, and on below the last. The objects ride it one
 * even gap apart — measured along the curve, sized so the third sits
 * exactly on the fourth station (`GAP`) — and progress `p` moves every one
 * `p` gaps up it together.
 */

/** Where the curve runs on above the first station, for what's passed: off the top of the screen. */
const ABOVE: readonly Point[] = [
  { x: 0.52, y: -0.8 },
  { x: 0.58, y: -0.48 },
  { x: 0.64, y: -0.17 },
];
/** Where it runs on below the last station, for the objects still to come: down off the screen, as the last one's way bends. */
const BELOW: readonly Point[] = [
  { x: 0.49, y: 1.8 },
  { x: 0.48, y: 2.12 },
  { x: 0.47, y: 2.44 },
  { x: 0.46, y: 2.76 },
  { x: 0.45, y: 3.08 },
  { x: 0.44, y: 3.4 },
];

/** The stations, top to bottom, the passed ones first: station `k` is `TRACK_STATIONS[k + ABOVE.length]`. */
const TRACK_STATIONS: readonly Point[] = [...ABOVE, ...IDEAL_OBJECTS, ...BELOW].map((p) => ({
  x: p.x,
  y: p.y,
}));
/** The last object: the furthest progress goes. */
export const TRACK_LAST = IDEAL_OBJECTS.length - 1;

/** Where on the curve station `u` falls (it may be between two): a Catmull-Rom curve through the stations. */
function stationAt(u: number): Point {
  "worklet";
  const last = TRACK_STATIONS.length - 1;
  const at = Math.min(last, Math.max(0, u + ABOVE.length));
  const i = Math.min(last - 1, Math.floor(at));
  const t = at - i;
  const p = (k: number) => TRACK_STATIONS[Math.max(0, Math.min(last, k))]!;
  const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  const along = (pa: number, pb: number, pc: number, pd: number) =>
    0.5 *
    (2 * pb +
      (pc - pa) * t +
      (2 * pa - 5 * pb + 4 * pc - pd) * t2 +
      (3 * pb - pa - 3 * pc + pd) * t3);
  return { x: along(a.x, b.x, c.x, d.x), y: along(a.y, b.y, c.y, d.y) };
}

/** How finely the curve is measured along (in stations). */
const MEASURE_STEP = 0.02;

/**
 * The curve measured along its length: each sampled station number (`at`)
 * and how far along the curve it lies from the first station (`along`,
 * shares of the width; less above it).
 */
const MEASURED = (() => {
  const at: number[] = [];
  const along: number[] = [];
  let total = 0;
  let before = stationAt(-ABOVE.length);
  for (
    let u = -ABOVE.length;
    u <= TRACK_STATIONS.length - ABOVE.length - 1 + 1e-9;
    u += MEASURE_STEP
  ) {
    const here = stationAt(u);
    total += Math.hypot(here.x - before.x, here.y - before.y);
    at.push(u);
    along.push(total);
    before = here;
  }
  const zero = along[Math.round(ABOVE.length / MEASURE_STEP)] ?? 0;
  return { at, along: along.map((a) => a - zero) };
})();

/** How far along the curve station `u` lies from the first (shares of the width). */
function alongAt(u: number): number {
  const i = Math.min(
    MEASURED.at.length - 1,
    Math.max(0, Math.round((u + ABOVE.length) / MEASURE_STEP)),
  );
  return MEASURED.along[i]!;
}

/** The even gap between objects along the curve: the third sits exactly on the fourth station. */
const GAP = alongAt(3) / 2;

/** Which station number lies `along` the curve from the first (shares of the width): found in the measure. */
function stationAlong(along: number): number {
  "worklet";
  const list = MEASURED.along;
  let lo = 0;
  let hi = list.length - 1;
  if (along <= list[0]!) return MEASURED.at[0]!;
  if (along >= list[hi]!) return MEASURED.at[hi]!;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (list[mid]! < along) lo = mid;
    else hi = mid;
  }
  const t = (along - list[lo]!) / (list[hi]! - list[lo]! || 1);
  return MEASURED.at[lo]! + (MEASURED.at[hi]! - MEASURED.at[lo]!) * t;
}

/** Each station's distance along the curve from the first: where its lines are passed. */
const STATION_ALONG: readonly number[] = IDEAL_OBJECTS.map((_, k) => alongAt(k));

/**
 * How much of a station's lines are left as the track reaches `shown`: all
 * of them until the last object has passed above the station, then fading
 * as it climbs one gap further, gone after that.
 */
export function linesLeftAt(station: number, shown: number): number {
  "worklet";
  const lastAlong = (TRACK_LAST - shown) * GAP;
  return Math.min(1, Math.max(0, 1 + (lastAlong - STATION_ALONG[station]!) / GAP));
}

/** An eased 0…1. */
export function smooth(t: number): number {
  "worklet";
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Past an end, the track gives less and less, as an iOS page does (`over` stations past it). */
export function rubberBanded(p: number, last: number): number {
  "worklet";
  const band = (over: number) => (1 - 1 / (over * 0.55 + 1)) / 0.55;
  if (p < 0) return -band(-p) * 0.35;
  if (p > last) return last + band(p - last) * 0.35;
  return p;
}

/** On first open the track draws in from the bottom up: how far drawn-in something `restY` down the board is. */
export function drawnInAt(drawIn: number, restY: number): number {
  "worklet";
  const wait = (1 - Math.min(1, Math.max(0, restY / IDEAL_HEIGHT))) * 0.5;
  return Math.min(1, Math.max(0, (drawIn - wait) / 0.5));
}

/** Where an object is, at progress `shown`. */
export type TrackPlace = {
  /** The station number it's at on the curve (0 is the first; between two as it rides; less is passed). */
  u: number;
  /** Its centre on the board, and how far that is from where it's drawn at rest (points). */
  x: number;
  y: number;
  dx: number;
  dy: number;
  presence: number;
};

/** The heading over the board (its top and bottom, points, on the board): what a passed object fades out under. */
export type HeadingBand = { top: number; bottom: number };

/**
 * How present an object is with its centre at `y` (points) and its radius
 * `r`: whole until its top edge reaches the heading's foot, fading as it
 * rises under it, gone by the time its centre reaches the heading's top.
 */
function presenceUnder(y: number, r: number, heading: HeadingBand): number {
  "worklet";
  const span = heading.bottom + r - heading.top;
  return span > 0 ? smooth((y - heading.top) / span) : 1;
}

/** Every object's place at progress `shown`, on a board `width` points wide, under `heading`. */
export function placesAt(shown: number, width: number, heading: HeadingBand): TrackPlace[] {
  "worklet";
  return IDEAL_OBJECTS.map((object, i) => {
    const u = stationAlong((i - shown) * GAP);
    const at = stationAt(u);
    return {
      u,
      x: at.x * width,
      y: at.y * width,
      dx: (at.x - object.x) * width,
      dy: (at.y - object.y) * width,
      presence: presenceUnder(at.y * width, (object.d * width) / 2, heading),
    };
  });
}
