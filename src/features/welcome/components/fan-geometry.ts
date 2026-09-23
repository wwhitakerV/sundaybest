import { PHONE_FRAME } from "@/ui/PhoneFrame";

import type { LiftPlacement } from "../logic/lift";

/**
 * Sizes for the Welcome screen's stage: one big phone in the middle, the
 * rest of the deck small and quiet behind it, the lifted piece of UI
 * floating over the big phone, and the step caption at the bottom. In
 * on-screen points from the stage's top left.
 *
 *   ┌───────────────────────────────┐  0
 *   │  ▯  ┌──────── main ───────┐ ▯ │  TOP_PAD — tops are never cut
 *   │  ▯  │  ┌─ lifted piece ─┐ │ ▯ │
 *   │     │  └────────────────┘ │   │  liftBottom
 *   │     … phones fade to white …  │  fade.to
 *   │         ☐ step caption        │  captionTop
 *   └───────────────────────────────┘  stage height (flexes with the page)
 */

/**
 * The phone on stage. Big enough that its text reads (about 13pt for 17pt
 * type) and only gently resampled; every card is built at this size.
 */
export const BUILD_WIDTH = 300;
/** Every other card: small and dimmed, so it reads as depth, not detail. */
const SUPPORT_WIDTH = 120;
export const REST_SCALE = SUPPORT_WIDTH / BUILD_WIDTH;
/** Design (real-phone) points to on-screen points, for the phone on stage. */
const BUILD_SCALE = BUILD_WIDTH / PHONE_FRAME.width;
export const BUILD_HEIGHT = PHONE_FRAME.height * BUILD_SCALE;
export const BUILD_RADIUS = PHONE_FRAME.radius * BUILD_SCALE;
/** The small cards pivot on a point this far below their top edge, as if held in a hand. */
export const PIVOT_DISTANCE = BUILD_HEIGHT * REST_SCALE * 1.6;

/** Room above every card: tilted corners and shadows never touch the top. */
export const TOP_PAD = 14;
/** How strongly the cards not on stage are dimmed. */
export const SUPPORT_OPACITY = 0.5;

/** The stage never gets shorter than this; below it, the page scrolls. */
export const MIN_STAGE_HEIGHT = 230;

const CAPTION_HEIGHT = 44;
const CAPTION_BOTTOM = 4;
/** The phones are fully white this far above the caption. */
const CAPTION_CLEARANCE = 6;
/** The ramp from clear to white above that. */
const FADE_RAMP = 64;
/** Gap between the lifted card and the caption. */
const LIFT_GAP = 10;
const LIFT_MIN_TOP = 6;
/** Clear space either side of the lifted card. */
export const LIFT_SIDE_PADDING = 8;
/** The floating card's padding around a lifted piece. */
export const LIFT_CARD_PADDING = 12;

export type StageGeometry = {
  caption: { bottom: number; height: number };
  /** Where the phones fade: clear at `from`, white by `to`. */
  fade: { from: number; to: number };
  /** The fade layer: that ramp, then solid white to the bottom. */
  fadeLayer: { height: number; solidHeight: number };
  /** The lifted card's bottom edge, and how high its top may go. */
  liftBottom: number;
  liftMinTop: number;
  /** The phone on stage: its top left, and its design-to-screen scale. */
  mainCard: LiftPlacement;
};

/** Everything placed on a stage `width` × `height` points. */
export function getStageGeometry(width: number, height: number): StageGeometry {
  const captionTop = height - CAPTION_BOTTOM - CAPTION_HEIGHT;
  const whiteFrom = captionTop - CAPTION_CLEARANCE;
  const fadeFrom = whiteFrom - FADE_RAMP;

  return {
    caption: { bottom: CAPTION_BOTTOM, height: CAPTION_HEIGHT },
    fade: { from: fadeFrom, to: whiteFrom },
    fadeLayer: { height: height - fadeFrom, solidHeight: height - whiteFrom },
    liftBottom: captionTop - LIFT_GAP,
    liftMinTop: LIFT_MIN_TOP,
    mainCard: { x: (width - BUILD_WIDTH) / 2, y: TOP_PAD, scale: BUILD_SCALE },
  };
}
