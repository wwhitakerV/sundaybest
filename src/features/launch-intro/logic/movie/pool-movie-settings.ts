/**
 * The pool movie's settings, locked from its prototype
 * (`docs/prototypes/launch-intro-pool-v6.html`): the keys its Copy settings
 * gives, so a new set can be pasted straight in. Timings in milliseconds. The
 * movie is filmed with these (`npm run render:intro`); a test fails until it's
 * filmed again after a change.
 */
export const POOL_MOVIE_SETTINGS = {
  /** How long the pen takes to write the wordmark. */
  writeMs: 4500,
  /** How wide the wordmark is written, in points. */
  writeWidth: 350,
  /** How much the letters drip: a multiplier on the rate. */
  drips: 0.3,
  /** How big each drip is: a multiplier. */
  dripSize: 0.6,
  /** How long a drop hangs under its letter before it falls. */
  hangMs: 240,
  /** How deep the pool pours in, as a percentage of the screen's height. */
  poolPct: 8,
  /** The pause after writing, before the letters fall. */
  pauseMs: 0,
  /** The delay after the letters pour in, before the pool erupts. */
  sinkMs: 0,
  /** How long the eruption takes to fill the screen. */
  splashMs: 1050,
  /** How long the screen stays full of water before it fades. */
  holdMs: 300,
  /** How long the full screen of water takes to fade to the page. */
  fadeMs: 250,
  /** The pool's living body — its caustic light, colour and glints — together. */
  waterBody: 0.82,
  /** How soon and how far the letters melt into streams as they fall. */
  melt: 0.7,
  /** Inside the written letters: how much like the pool's water they are. */
  textWaterLikeness: 1.42,
  /** Inside the written letters: their sheen and glints. */
  textWaterShine: 1.25,
  /** Inside the written letters: the gleam that sweeps across the word. */
  textWaterGleam: 0.5,
  /** Inside the written letters: the pool's colour patches and bands. */
  textWaterColor: 2,
  /** How strong the colour is at the pool's and the eruption's edges. */
  poolEdgeColor: 0.15,
  /** How strong the colour is at the drips' edges. */
  dripEdgeColor: 1.3,
  /** How long the pool takes to pour in, from the bottom right, at the start. */
  pourMs: 1600,
  /** How much the landed drips raise the pool. */
  waterVolumeFromDrip: 0.8,
  /** How long after the pool starts pouring in the pen starts writing. */
  textDrawStartAfterPoolEntry: 1650,
  /** How much of the red page shows through the letters. */
  textSeeThrough: 1,
  /** How much of the red page shows through the drips. */
  dripSeeThrough: 1,
  /** How far the letters' corners and serifs round off, as liquid's do. */
  textLiquidOutline: 2,
  /** How much the letters swell. */
  textSwell: 0.6,
  /** The bead of water at the pen's tip. */
  textWetPen: 1,
  /** How much a letter swells as it's written, then ripples as it settles. */
  textSettle: 1,
  /** How much the letters' outlines move. */
  textWobble: 4,
  /** The soft reflection drifting across the word. */
  textReflection: 1,
  /** Small sharp glints in the letters. */
  textSparkle: 0.65,
  /** The colour split at the letters' rims. */
  textRimColor: 2.3,
  /** How far the letters turn to the pool's look as they fall into it. */
  textBlendToPool: 1,
  /** How much of the red page shows through the pool and the eruption. */
  poolSeeThrough: 0.65,
  /** Lifts the see-through red of the letters, drips and pool toward white. */
  wetWhiteness: 0.1,
  /** The letters only: whiter, on top of `wetWhiteness`. */
  textWhiteness: 0.16,
  /** The letters only: softer, rounder and more liquid. */
  textWetness: 2,
  /** The word's place across the screen, in points from its centre: an optical nudge left. */
  wordOffsetX: -2,
} as const;

export type PoolMovieSettings = { readonly [K in keyof typeof POOL_MOVIE_SETTINGS]: number };
