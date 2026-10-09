import { OLD_TESTAMENT_BOOKS } from "./bible-books";

/** How many books the map holds. */
export const MAP_BOOKS = 66;
/** The break between the Testaments, in lines' widths. */
const TESTAMENT_GAP = 1.5;
/** The map's columns at full width: a column a book, and the Testaments' break. */
const COLUMNS = MAP_BOOKS + TESTAMENT_GAP;

/**
 * As far in as the map zooms: about a dozen books across, each line wide
 * enough to pick out with a finger and to tell from its neighbours, with the
 * Bible still reading as a run of books rather than a few lone bars.
 */
export const MAX_ZOOM = 5.5;

/** A book's column's width, at a zoom, across a map this wide. */
export function columnWidth(width: number, zoom: number): number {
  "worklet";
  return (width / COLUMNS) * zoom;
}

/** Where a book's line is centred on the map, at full width (zoom 1). */
export function lineCentre(index: number, width: number): number {
  "worklet";
  return (index + (index >= OLD_TESTAMENT_BOOKS ? TESTAMENT_GAP : 0) + 0.5) * columnWidth(width, 1);
}

/** The book under a point on the map, at full width (zoom 1). */
export function bookAt(x: number, width: number): number {
  "worklet";
  const column = columnWidth(width, 1);
  const old = Math.floor(x / column);
  const index = old >= OLD_TESTAMENT_BOOKS ? Math.floor(x / column - TESTAMENT_GAP) : old;
  return Math.min(Math.max(index, 0), MAP_BOOKS - 1);
}

/** How far the zoomed map may slide: never past either end of the Bible. */
export function clampOffset(offset: number, zoom: number, width: number): number {
  "worklet";
  return Math.min(0, Math.max(width - width * zoom, offset));
}

/** A zoom kept between the whole Bible and as far in as it goes. */
export function clampZoom(zoom: number): number {
  "worklet";
  return Math.min(Math.max(zoom, 1), MAX_ZOOM);
}
