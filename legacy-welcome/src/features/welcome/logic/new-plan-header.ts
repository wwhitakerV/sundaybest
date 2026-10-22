import { controlHeight, space } from "@/theme";

/** How far down New Plan's mock starts its fixed header bar. */
export const NEW_PLAN_HEADER_TOP = space[12];

/**
 * The fixed header bar's height; the content scrolls beneath it. The stage
 * needs it to know where the scrolling part of the screen starts.
 */
export const NEW_PLAN_HEADER_HEIGHT = NEW_PLAN_HEADER_TOP + controlHeight.header;
