import { space } from "@/theme";

/** The sermon fields' edge. */
export const FIELD_EDGE = 1;
/** Their leading icon (the link, the magnifier). */
export const FIELD_ICON = 22;
/** From inside their edge to that icon. */
export const FIELD_ICON_INSET = space[20];
/** From a field's left edge to its icon's centre: what sits under a field lines up on it. */
export const FIELD_ICON_CENTRE = FIELD_EDGE + FIELD_ICON_INSET + FIELD_ICON / 2;
