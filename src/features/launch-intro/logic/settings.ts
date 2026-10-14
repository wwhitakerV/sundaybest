/**
 * The launch intro's settings, locked from the browser prototype (version B,
 * "the pool"): every timing in milliseconds.
 */
export const INTRO_SETTINGS = {
  /** How long the pen takes to write the wordmark. */
  writeMs: 4500,
  /** How wide the wordmark is written, in points (narrower on a small phone). */
  writeWidth: 350,
  /** How much the letters drip: a multiplier on the rate. */
  drips: 1.5,
  /** How big each drip is: a multiplier. */
  dripSize: 0.65,
  /** How long a drop hangs under its letter before it falls. */
  hangMs: 240,
  /** How full the pool is as the letters let go, as a percentage of the screen's height. */
  poolPct: 7,
  /** The pause after writing, before the letters fall. */
  pauseMs: 0,
  /** The delay after the letters pour in, before the pool erupts. */
  sinkMs: 0,
  /** How long the eruption takes to fill the screen. */
  splashMs: 1050,
  /** How long the screen stays full colour before the page arrives under it. */
  holdMs: 200,
} as const;

export type IntroSettings = { readonly [K in keyof typeof INTRO_SETTINGS]: number };

/** The screen the intro plays on, in points. */
export type Stage = { width: number; height: number };

/** Gravity for each kind of falling thing, in points per ms². */
export const GRAVITY = {
  drip: 0.0042,
  letter: 0.0018,
  spray: 0.0024,
  kick: 0.004,
  /** A drop the water intro's drained water pops up as it leaves the bottom. */
  pop: 0.0026,
} as const;

/** How much a letter adds to the pool's height as it pours in, in points. */
export const LETTER_VOLUME = 0.6;

/** How many segments the water's edge is drawn with, across the screen. */
export const EDGE_SEGMENTS = 66;

/**
 * The prototype's phone width. Positions it picked across the screen scale by
 * `stage.width / PROTOTYPE_WIDTH`, so the same moments land in the same places
 * on any iPhone.
 */
export const PROTOTYPE_WIDTH = 390;
