import { clampUnit } from "@/utils/motion/clampUnit";
import { BAR_ROW_HEIGHT, BAR_THUMB_WIDTH, type CollapseGeometry } from "./hero-collapse";

/**
 * The hero's artwork flying up into the plan bar's thumbnail as Home's
 * featured plan collapses (`hero-collapse`): where it starts, where it lands,
 * and how far along the way it is. Worklets, with the scroll.
 */

/** Thumbnails are YouTube's: always 16:9. */
const THUMB_ASPECT = 9 / 16;
/** Over how much of the first scroll the flying copy fades in over the hero's artwork. */
const FLIGHT_HANDOFF_RANGE = 24;

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

/**
 * Eases in and out, gently (a sine): moving soon after it sets off, so the
 * flight's seen to begin with the hero, quick through the middle, soft to land.
 */
function easeInOut(progress: number): number {
  "worklet";
  return (1 - Math.cos(Math.PI * progress)) / 2;
}

/**
 * How far the artwork's flight to the bar has come (0–1): from the moment
 * the hero starts to move — rising to the top of the phone, then collapsing
 * — landing as the collapse does. None before the hero's measured.
 */
export function getFlightProgress(scrolled: number, geometry: CollapseGeometry): number {
  "worklet";
  if (geometry.collapseRange <= 0) return 0;
  return clampUnit(scrolled / (geometry.screenTop + geometry.collapseRange));
}

/**
 * How far the flying copy has faded in over the hero's own artwork (0–1),
 * over the first of the scroll, while it's barely moved — so the words'
 * colour over the artwork's lower part fades away rather than popping.
 */
export function getFlightHandoff(scrolled: number): number {
  "worklet";
  return clampUnit(scrolled / FLIGHT_HANDOFF_RANGE);
}

/**
 * The artwork in flight, `progress` (0–1) of the way from the hero's artwork
 * to the bar's thumbnail — eased, so it lifts off gently and lands softly.
 */
export function getFlightRect(progress: number, from: Rect, to: Rect): Rect {
  "worklet";
  const eased = easeInOut(clampUnit(progress));
  const toward = (a: number, b: number) => a + (b - a) * eased;
  return {
    x: toward(from.x, to.x),
    y: toward(from.y, to.y),
    width: toward(from.width, to.width),
    height: toward(from.height, to.height),
  };
}
