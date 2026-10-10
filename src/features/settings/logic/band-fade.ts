/**
 * Whether a line in a page's scroll has risen clear of the fade at the
 * screen's foot: on screen at or above the fade's top edge. `lineY` is where
 * the line sits in the scroll's content, null until it's measured.
 */
export function hasClearedFade({
  lineY,
  scrollY,
  viewportHeight,
  fadeHeight,
}: {
  lineY: number | null;
  scrollY: number;
  viewportHeight: number;
  fadeHeight: number;
}): boolean {
  if (lineY === null) return false;
  return lineY - scrollY <= viewportHeight - fadeHeight;
}
