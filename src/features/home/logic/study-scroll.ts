import { clampUnit } from "@/utils/motion/clampUnit";

/**
 * How Home's featured study answers the scroll: its artwork held back a
 * little (parallax) and stretching when pulled down past the top; the words
 * and Continue under it collapsing up into the plan bar with the gesture,
 * fading; the masthead fading as the artwork reaches it; and the bar coming
 * in, white, as the artwork leaves — the artwork flying up into its
 * thumbnail. All worked out from how far the page has scrolled, so it tracks
 * the finger and reverses on the way back. Worklets: they run on the UI
 * thread, with the scroll.
 *
 * A worklet here calls only worklets defined above it. A worklet's closure
 * is captured in file order, so one calling another defined further down
 * finds nothing on the UI thread — and an error there aborts the app.
 */

/** Where things sit with the page at rest, in window points — measured once laid out. */
export type StudyScrollGeometry = {
  artworkLeft: number;
  artworkTop: number;
  artworkWidth: number;
  artworkHeight: number;
  /** The top of the words under the artwork, and of Continue under them. */
  wordsTop: number;
  continueTop: number;
  /** The masthead's top: gone by the time the artwork reaches it. */
  mastheadTop: number;
  /** The plan bar's foot: the status bar and its row. */
  barBottom: number;
};

export type Rect = { x: number; y: number; width: number; height: number };

/** How much of the scroll the artwork holds back as it goes: a layer under the words, not flat on the page. */
export const PARALLAX = 0.15;
/** The bar comes in over the artwork's last this much of its height, landing as it's gone. */
const BAR_OVER = 0.6;
/**
 * The content under the artwork collapsing with the gesture: over its last
 * this-many points before the bar it speeds up — rising up to `COLLAPSE_RISE`
 * further than the scroll — and fades away, so it dissolves up into the bar.
 */
const COLLAPSE_RANGE = 140;
const COLLAPSE_RISE = 24;
/** How finely the page outside the hand-off is marked for snapping — too fine to feel. */
const SNAP_STEP = 2;

/** Whether the page's been measured: until then nothing moves. */
function isMeasured(geometry: StudyScrollGeometry): boolean {
  "worklet";
  return geometry.artworkHeight > 0;
}

/** The artwork's offset as it scrolls: held back by `parallax` of the distance. */
export function getArtworkLift(scrolled: number, parallax: number): number {
  "worklet";
  return scrolled > 0 ? scrolled * parallax : 0;
}

/** How much the artwork grows when the page is pulled down past its top: from its foot, up into the room. */
export function getArtworkStretch(scrolled: number, geometry: StudyScrollGeometry): number {
  "worklet";
  if (scrolled >= 0 || !isMeasured(geometry)) return 1;
  return 1 + -scrolled / geometry.artworkHeight;
}

/** The scroll over which the bar comes in: as the artwork's last part passes under where the bar sits. */
export function getBarRange(geometry: StudyScrollGeometry, parallax: number) {
  "worklet";
  const bottom = geometry.artworkTop + geometry.artworkHeight;
  const end = Math.max(0, (bottom - geometry.barBottom) / (1 - parallax));
  const start = Math.max(
    0,
    (bottom - geometry.barBottom - geometry.artworkHeight * BAR_OVER) / (1 - parallax),
  );
  return { start, end };
}

/** How far in the bar has come, 0 to 1 — the masthead giving way as it does. */
export function getBarProgress(
  scrolled: number,
  geometry: StudyScrollGeometry,
  parallax: number,
): number {
  "worklet";
  if (!isMeasured(geometry)) return 0;
  const { start, end } = getBarRange(geometry, parallax);
  return end > start ? clampUnit((scrolled - start) / (end - start)) : scrolled >= end ? 1 : 0;
}

/**
 * A part of the study under the artwork (whose top is `top` at rest) as it
 * nears the bar: fading out as it rises faster than the scroll.
 */
export function getCollapse(scrolled: number, top: number, geometry: StudyScrollGeometry) {
  "worklet";
  if (!isMeasured(geometry) || top === 0) return { opacity: 1, rise: 0 };
  const collapsed = clampUnit(1 - (top - scrolled - geometry.barBottom) / COLLAPSE_RANGE);
  return { opacity: 1 - collapsed, rise: -collapsed * COLLAPSE_RISE };
}

/** Where the artwork is on the screen as the page scrolls, held back by the parallax. */
export function getArtworkRect(
  scrolled: number,
  geometry: StudyScrollGeometry,
  parallax: number,
): Rect {
  "worklet";
  return {
    x: geometry.artworkLeft,
    y: geometry.artworkTop - scrolled + getArtworkLift(scrolled, parallax),
    width: geometry.artworkWidth,
    height: geometry.artworkHeight,
  };
}

/**
 * The masthead as the artwork comes up to it: whole while the artwork's below
 * it, gone by the time the artwork's top reaches its top. Calls
 * `getArtworkRect`, so it's defined after it.
 */
export function getMastheadOpacity(
  scrolled: number,
  geometry: StudyScrollGeometry,
  parallax: number,
): number {
  "worklet";
  if (!isMeasured(geometry) || geometry.mastheadTop === 0) return 1;
  const room = geometry.artworkTop - geometry.mastheadTop;
  if (room <= 0) return 1;
  return clampUnit((getArtworkRect(scrolled, geometry, parallax).y - geometry.mastheadTop) / room);
}

/** The artwork in flight, `progress` of the way from where it is into the bar's thumbnail. */
export function getFlightRect(progress: number, from: Rect, to: Rect): Rect {
  "worklet";
  const mix = (a: number, b: number) => a + (b - a) * progress;
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    width: mix(from.width, to.width),
    height: mix(from.height, to.height),
  };
}

/**
 * Where iOS may bring a let-go scroll to rest: inside the hand-off only its
 * two ends — the study whole, the bar in — so the page never rests halfway;
 * everywhere else a couple of points apart, so a flick coasts on as it
 * would. None before the page is measured.
 */
export function getSnapOffsets(range: { start: number; end: number }, maxScroll: number): number[] {
  if (range.end <= range.start) return [];
  const offsets: number[] = [];
  for (let offset = 0; offset < range.start; offset += SNAP_STEP) offsets.push(offset);
  offsets.push(range.start, range.end);
  const bottom = Math.max(range.end, maxScroll);
  for (let offset = range.end + SNAP_STEP; offset < bottom; offset += SNAP_STEP)
    offsets.push(offset);
  if (bottom > range.end) offsets.push(bottom);
  return offsets;
}
