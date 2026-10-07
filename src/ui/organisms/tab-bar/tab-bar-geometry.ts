import { FLOATING_NAV_BAR } from "../floatingNavBar";
import type { TabBarRaiseGeometry } from "./use-tab-bar-raise";

export const {
  capsuleHeight: CAPSULE_HEIGHT,
  capsuleRadius: CAPSULE_RADIUS,
  capsuleHPadding: CAPSULE_H_PADDING,
  capsuleVPadding: CAPSULE_V_PADDING,
  sideMargin: SIDE_MARGIN,
} = FLOATING_NAV_BAR;
export const GAP_TO_FAB = 10;
export const TAB_HEIGHT = CAPSULE_HEIGHT - CAPSULE_V_PADDING * 2;
export const TAB_PILL_RADIUS = CAPSULE_RADIUS - CAPSULE_H_PADDING;
export const TAB_ICON_SIZE = 23;
export const CAPSULE_BORDER_WIDTH = 1;
export const FAB_SIZE = 66;
/** The capsule's centred on the FAB, so it sits this far inside the row's top and bottom. */
export const CAPSULE_INSET_IN_ROW = (FAB_SIZE - CAPSULE_HEIGHT) / 2;
/**
 * How much higher the screen's button sits raised above the open tabs than
 * beside the gathered ones — a capsule and a gap. The bar keeps this much
 * room above its row, always, so the raised button's inside its frame and
 * takes taps; the room itself passes touches through.
 */
export const RAISE_LIFT = CAPSULE_HEIGHT + GAP_TO_FAB;
/** The bar's raise geometry, but for how far the FAB drops — that depends on the safe area, so the bar adds it. */
export const RAISE_GEOMETRY: Omit<TabBarRaiseGeometry, "fabDrop"> = {
  beside: {
    top: RAISE_LIFT + CAPSULE_INSET_IN_ROW,
    left: CAPSULE_HEIGHT + GAP_TO_FAB,
    right: FAB_SIZE + GAP_TO_FAB,
  },
  raised: { top: CAPSULE_INSET_IN_ROW, left: 0, right: 0 },
  fabScale: CAPSULE_HEIGHT / FAB_SIZE,
  lift: RAISE_LIFT,
};
