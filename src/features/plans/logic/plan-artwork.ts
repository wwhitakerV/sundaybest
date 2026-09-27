/** Of the page's width (inside its inset) — as Home's hero. */
const WIDTH_RATIO = 0.82;
/** Thumbnails are YouTube's: always 16:9. */
const THUMB_ASPECT = 9 / 16;
/** Between the nav buttons' bottom and the artwork's top. */
const GAP_BELOW_NAV = 24;

export type PlanArtworkFrame = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
};

/**
 * Where Plan Detail's artwork sits in its hero, flush to the screen's top:
 * centred, a little below the nav buttons (`navBottom`, down the screen),
 * 82% of the page's width inside its `inset`, at the thumbnail's 16:9 — the
 * same artwork as Home's hero.
 */
export function getPlanArtworkFrame({
  screenWidth,
  inset,
  navBottom,
}: {
  screenWidth: number;
  inset: number;
  navBottom: number;
}): PlanArtworkFrame {
  const width = (screenWidth - inset * 2) * WIDTH_RATIO;
  const height = width * THUMB_ASPECT;
  const top = navBottom + GAP_BELOW_NAV;
  return { top, left: (screenWidth - width) / 2, width, height, bottom: top + height };
}
