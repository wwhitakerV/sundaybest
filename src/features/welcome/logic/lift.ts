/**
 * Where a lifted piece of UI starts and ends, as pure geometry. The piece is
 * drawn at its real size and rests, lifted, at exactly that size — text is
 * only perfectly sharp at 1:1 — shrinking only if a small screen leaves it no
 * room. It is never enlarged.
 */

/** A rect in a mock's own layout: real-phone points, from the phone frame's top left. */
export type DesignRect = { x: number; y: number; width: number; height: number };

/** A top-left position and uniform scale (about the top left), in the stage's coordinates. */
export type LiftPlacement = { x: number; y: number; scale: number };

export type LiftLayoutOptions = {
  /** The piece's place in its mock. */
  anchor: DesignRect;
  /** The phone on stage: its top left, and its design-to-screen scale. */
  card: LiftPlacement;
  /** The stage's width; the lifted piece is centred in it. */
  stageWidth: number;
  /** The floating card's bottom edge sits here, just above the step caption… */
  bottom: number;
  /** …and its top may go no higher than this. */
  minTop: number;
  /** Clear space kept either side of the floating card. */
  sidePadding: number;
  /** The floating card's padding around the piece. */
  cardPadding: number;
  /** The band where the phones fade into the page: clear at `from`, white by `to`. */
  fade: { from: number; to: number };
};

export type LiftLayout = {
  /** Exactly over the piece's copy on the phone — where the lift starts and ends. */
  onPhone: LiftPlacement;
  /**
   * How much of the phone's copy shows through the fade there (0–1). The
   * lifted copy starts and ends at this strength, so a piece low on the
   * phone rises out of the white instead of popping into view.
   */
  onPhoneOpacity: number;
  /** Centred above the caption, on its floating card: real size if it fits. */
  lifted: LiftPlacement;
};

export function getLiftLayout({
  anchor,
  card,
  stageWidth,
  bottom,
  minTop,
  sidePadding,
  cardPadding,
  fade,
}: LiftLayoutOptions): LiftLayout {
  const liftedScale = Math.min(
    1,
    (bottom - minTop - cardPadding * 2) / anchor.height,
    (stageWidth - sidePadding * 2 - cardPadding * 2) / anchor.width,
  );

  const onPhoneY = card.y + anchor.y * card.scale;
  const onPhoneMiddle = onPhoneY + (anchor.height * card.scale) / 2;
  const fadeSpan = Math.max(fade.to - fade.from, 1);

  return {
    onPhone: {
      x: card.x + anchor.x * card.scale,
      y: onPhoneY,
      scale: card.scale,
    },
    onPhoneOpacity: Math.min(1, Math.max(0, (fade.to - onPhoneMiddle) / fadeSpan)),
    lifted: {
      x: (stageWidth - anchor.width * liftedScale) / 2,
      y: bottom - cardPadding - anchor.height * liftedScale,
      scale: liftedScale,
    },
  };
}

export type RevealWindow = {
  /** The bottom of the part of the phone in view, in the mock's own layout (design points). */
  visibleBottom: number;
  /** Clear space kept below the piece once it's scrolled into view. */
  bottomMargin: number;
};

/**
 * How far a screen should scroll (design points, 0 = top) to bring `anchor`
 * just into view above the bottom of the part of the phone the stage shows —
 * no further than it needs to, and not at all if it's already in view.
 */
export function getScrollToReveal(anchor: DesignRect, window: RevealWindow): number {
  return Math.max(0, anchor.y + anchor.height + window.bottomMargin - window.visibleBottom);
}

export type ScrollWindow = {
  /** Where the screen's scrolling content starts, in the mock's own layout (design points). */
  contentTop: number;
  /** How far the content can scroll at most. */
  maxScroll: number;
  /** Clear space kept above the piece once it's scrolled to. */
  topMargin: number;
};

/**
 * How far a screen should scroll (design points, 0 = top) to bring `anchor`
 * into view near the top of the part of the phone the stage shows — high
 * enough to be clearly seen before it lifts, and never past either end of
 * the page.
 */
export function getScrollToShow(anchor: DesignRect, window: ScrollWindow): number {
  const wanted = anchor.y - window.contentTop - window.topMargin;
  return Math.min(window.maxScroll, Math.max(0, wanted));
}
