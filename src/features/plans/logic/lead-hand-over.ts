/**
 * Whether the lead's Continue is out of view, so the tab bar should take it:
 * any of it under the header's foot or behind the dock, as the page scrolls.
 * `top` is its place down the screen when the page was scrolled `measuredAt`;
 * `scrolled` is the page's scroll now. Never before it's been measured.
 */
export function isLeadContinueOutOfView(input: {
  top: number | null;
  height: number;
  measuredAt: number;
  scrolled: number;
  headerFoot: number;
  dockTop: number;
}): boolean {
  "worklet";
  const { top, height, measuredAt, scrolled, headerFoot, dockTop } = input;
  if (top === null) return false;
  const now = top - (scrolled - measuredAt);
  return now < headerFoot || now + height > dockTop;
}
