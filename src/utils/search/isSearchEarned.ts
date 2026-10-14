/**
 * Whether a list offers search: once it's long enough for scrolling to stop
 * being the quick way to find something (`threshold`), and from then on,
 * though it shrinks again — a search that came and went would be lost.
 */
export function isSearchEarned({
  count,
  threshold,
  shownBefore,
}: {
  count: number;
  threshold: number;
  shownBefore: boolean;
}): boolean {
  return shownBefore || count >= threshold;
}
