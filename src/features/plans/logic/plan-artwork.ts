/** Of the page's width (inside its inset) — as Home's hero. */
const WIDTH_RATIO = 0.82;
/** Thumbnails are YouTube's: always 16:9. */
const THUMB_ASPECT = 9 / 16;
/** Between the nav buttons' bottom and the artwork's top. */
const GAP_BELOW_NAV = 16;

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

/** Of the content under the artwork, how much the colour over it takes to come in. */
const COVER_FADE_RATIO = 0.75;

/**
 * Where the colour over Plan Detail's artwork comes in, down the hero: clear
 * at the artwork's bottom edge, solid three quarters of the way down the
 * content under it — so the artwork dissolves gradually as it drifts down
 * behind the words. None until the hero's measured (`heroHeight` 0).
 */
export function getPlanCoverFade({
  artworkBottom,
  heroHeight,
}: {
  artworkBottom: number;
  heroHeight: number;
}): { from: number; to: number } | null {
  if (heroHeight <= artworkBottom) return null;
  return {
    from: artworkBottom,
    to: artworkBottom + (heroHeight - artworkBottom) * COVER_FADE_RATIO,
  };
}
