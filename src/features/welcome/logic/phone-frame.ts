/**
 * The drawn iPhone's screen: a 393×852pt iPhone (the app's layout baseline),
 * its bezel, its corners, and the status bar across its top. The status bar
 * is the system's, drawn to match iOS rather than the app's own type scale.
 */
export const PHONE_SCREEN = {
  width: 393,
  height: 852,
  bezel: 12,
  radius: 50,
  statusBarHeight: 54,
} as const;

const { width, height, bezel, radius, statusBarHeight } = PHONE_SCREEN;

/** Outer size of a `PhoneFrame`, bezel included — what a scaler scales. */
export const PHONE_FRAME = {
  /** The content area inside the bezel, below the status bar — where a screen is laid out. */
  contentTop: bezel + statusBarHeight,
  contentWidth: width,
  contentHeight: height - statusBarHeight,
  width: width + bezel * 2,
  height: height + bezel * 2,
  radius: radius + bezel,
} as const;
