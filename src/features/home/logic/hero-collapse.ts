/**
 * How Home's featured plan collapses into the plan bar as it scrolls up, the
 * way Apple collapses a large header: it rises over the page's header until
 * its top reaches the top of the phone, then holds there and shortens point
 * for point with the scroll — the list staying attached below it — until
 * it's the bar's height. Along the way its words fade, its artwork flies up
 * into the bar's thumbnail, and the bar settles in over the last of it.
 *
 * All worked out from how far the content has scrolled, so it tracks the
 * finger and reverses on the way back. Worklets: they run on the UI thread,
 * with the scroll.
 */

/** Where things sit, in scroll distance, measured from the laid-out screen. */
export type CollapseGeometry = {
  /** How far the content scrolls before the hero's top reaches the header. */
  headerCross: number;
  /** …and before it reaches the top of the phone. */
  screenTop: number;
  /** The status bar's height. */
  statusBar: number;
  /** The hero's full height. */
  heroHeight: number;
  /** How far it collapses, from its full height to the bar's — the same scroll, point for point. */
  collapseRange: number;
};

/** The hero's corner radius at rest. */
export const HERO_RADIUS = 36;
/** Over how much scroll the corners straighten, arriving square at the top. */
const CORNER_RANGE = 100;
/** The hero's words are gone by this far through the collapse… */
const CONTENT_GONE_AT = 0.6;
/** …when the bar starts coming in, landing as the hero reaches its height. */
const BAR_FROM = 0.6;
/** The plan bar's row, below the status bar, and its thumbnail's width and corners. */
export const BAR_ROW_HEIGHT = 60;
export const BAR_THUMB_WIDTH = 64;
export const BAR_THUMB_RADIUS = 8;
/** The hero's artwork: its share of the page's width, its corners, and the room above it. */
export const HERO_ARTWORK_WIDTH_RATIO = 0.82;
export const HERO_ARTWORK_RADIUS = 20;
export const HERO_BREATHE_TOP = 52;
/** Room for the hero's colour to breathe below its day line. */
export const HERO_BREATHE_BOTTOM = 44;
/** Thumbnails are YouTube's: always 16:9. */
const THUMB_ASPECT = 9 / 16;

function clamp(value: number): number {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

/**
 * The scroll distances from the laid-out screen: the status bar's height,
 * the header's bottom and the scroll view's top (both measured down from
 * below the status bar), how far in the content starts, and the hero's and
 * the bar's heights.
 */
export function getCollapseGeometry(layout: {
  insetTop: number;
  headerBottom: number;
  scrollTop: number;
  contentTop: number;
  heroHeight: number;
  barHeight: number;
}): CollapseGeometry {
  const { insetTop, headerBottom, scrollTop, contentTop, heroHeight, barHeight } = layout;
  return {
    headerCross: scrollTop - headerBottom + contentTop,
    screenTop: insetTop + scrollTop + contentTop,
    statusBar: insetTop,
    heroHeight,
    collapseRange: Math.max(0, heroHeight - barHeight),
  };
}

/** How far the hero has collapsed (0–1): none until it reaches the top of the phone, then point for point with the scroll. */
export function getCollapseProgress(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  if (geometry.collapseRange <= 0) return scrolled > geometry.screenTop ? 1 : 0;
  return clamp((scrolled - geometry.screenTop) / geometry.collapseRange);
}

/**
 * The hero pinned at the top as it collapses: how far it's held down against
 * the scroll (`offset`), and how tall it shows — a point shorter for every
 * point scrolled, down to the bar's height. Before it reaches the top it's
 * whole, and scrolls as the page does.
 */
export function getHeroPin(
  scrolled: number,
  geometry: CollapseGeometry,
): { offset: number; height: number } {
  "worklet";
  const offset = Math.min(geometry.collapseRange, Math.max(0, scrolled - geometry.screenTop));
  return { offset, height: geometry.heroHeight - offset };
}

/** The hero's words fade over the first part of the collapse, gone before the bar comes in. */
export function getHeroContentOpacity(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  return 1 - clamp(getCollapseProgress(scrolled, geometry) / CONTENT_GONE_AT);
}

/**
 * The header holds while the hero comes toward it, then fades with the
 * scroll as the hero passes over it: whole until the hero's 80% of the way
 * there, gone at 1.8 times that distance.
 */
export function getHeaderOpacity(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  return geometry.headerCross <= 0 ? 1 : clamp(1.8 - scrolled / geometry.headerCross);
}

/** The hero's corners straighten as it nears the top of the phone, square once there. */
export function getHeroCornerRadius(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  return HERO_RADIUS * clamp((geometry.screenTop - scrolled) / CORNER_RANGE);
}

/** How far the plan bar has come in (0–1): over the last of the collapse, in as the hero reaches its height. */
export function getBarProgress(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  return clamp((getCollapseProgress(scrolled, geometry) - BAR_FROM) / (1 - BAR_FROM));
}

/** What should take taps, and the status bar's shade, at a point in the scroll. */
export type CollapsePhase = {
  headerTouchable: boolean;
  barTouchable: boolean;
  lightStatusBar: boolean;
};

/**
 * The header takes taps until it's mostly faded; the bar once it's mostly
 * in; the status bar turns light once the hero's colour is under it.
 */
export function getCollapsePhase(scrolled: number, geometry: CollapseGeometry): CollapsePhase {
  "worklet";
  return {
    headerTouchable: getHeaderOpacity(scrolled, geometry) > 0.25,
    barTouchable: getBarProgress(scrolled, geometry) >= 0.5,
    lightStatusBar: scrolled >= geometry.screenTop - geometry.statusBar,
  };
}

/** A rectangle on screen, in points from the phone's top left. */
export type Rect = { x: number; y: number; width: number; height: number };

/** How the hero lays out its artwork: the screen's width, the page inset, the artwork's share of the width inside it, and the room above it. */
export type ArtworkFrame = {
  screenWidth: number;
  inset: number;
  widthRatio: number;
  breatheTop: number;
};

/**
 * Where the hero's artwork is on screen at a point in the scroll — centred,
 * carried up with the hero, and held with it once it's pinned at the top.
 */
export function getArtworkRect(
  scrolled: number,
  geometry: CollapseGeometry,
  frame: ArtworkFrame,
): Rect {
  "worklet";
  const width = (frame.screenWidth - frame.inset * 2) * frame.widthRatio;
  return {
    x: (frame.screenWidth - width) / 2,
    y: Math.max(0, geometry.screenTop - scrolled) + frame.breatheTop,
    width,
    height: width * THUMB_ASPECT,
  };
}

/** Where the plan bar's thumbnail sits: at the page inset, centred in the bar's row. */
export function getBarThumbRect(insetTop: number, inset: number): Rect {
  "worklet";
  const height = BAR_THUMB_WIDTH * THUMB_ASPECT;
  return { x: inset, y: insetTop + (BAR_ROW_HEIGHT - height) / 2, width: BAR_THUMB_WIDTH, height };
}

/** Eases in and out: slow off the mark, quick through the middle, soft to land. */
function easeInOut(progress: number): number {
  "worklet";
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

/**
 * The artwork in flight, `progress` (0–1) of the way from the hero's artwork
 * to the bar's thumbnail — eased, so it lifts off gently and lands softly.
 */
export function getFlightRect(progress: number, from: Rect, to: Rect): Rect {
  "worklet";
  const eased = easeInOut(clamp(progress));
  const toward = (a: number, b: number) => a + (b - a) * eased;
  return {
    x: toward(from.x, to.x),
    y: toward(from.y, to.y),
    width: toward(from.width, to.width),
    height: toward(from.height, to.height),
  };
}

/** How finely the page outside the collapse is marked for snapping — too fine to feel. */
const SNAP_STEP = 2;

/**
 * Where iOS may bring a let-go scroll to rest — the way Apple settles a
 * collapsing header. iOS works out where a flick would naturally land and
 * rests on the snap point nearest it (in the flick's direction). So:
 *
 * - Inside the collapse there are none but its two ends — fully open, fully
 *   in — so a flick that would stop there, half-formed, glides on to one.
 * - Everywhere else — above it and below it, to the page's bottom — they're
 *   a couple of points apart, so a flick coasts on to within a hair of
 *   where it would anyway: a hard flick carries straight through the
 *   collapse and on, in either direction.
 *
 * `maxScroll` is how far the page scrolls. None before the hero's measured.
 */
export function getSnapOffsets(geometry: CollapseGeometry, maxScroll: number): number[] {
  if (geometry.collapseRange <= 0) return [];
  const start = geometry.screenTop;
  const end = geometry.screenTop + geometry.collapseRange;
  const offsets: number[] = [];
  for (let offset = 0; offset < start; offset += SNAP_STEP) offsets.push(offset);
  offsets.push(start, end);
  const bottom = Math.max(end, maxScroll);
  for (let offset = end + SNAP_STEP; offset < bottom; offset += SNAP_STEP) offsets.push(offset);
  if (bottom > end) offsets.push(bottom);
  return offsets;
}

/**
 * Whether the hero's height can be measured now: only while it's whole — at
 * rest, or on its way to the top. Mid-collapse it's being held shorter than
 * it really is, and a measurement then would feed back into the collapse
 * itself, the page jumping as its room for the hero changed.
 */
export function isHeroMeasurable(scrolled: number, geometry: CollapseGeometry): boolean {
  return scrolled <= geometry.screenTop;
}
