/**
 * The water intro's settings, locked from the browser prototype
 * (`docs/prototypes/launch-intro-pool-v4.html`): the keys its Copy settings
 * gives, so a new set can be pasted straight in. Timings in milliseconds.
 */
export const WATER_SETTINGS = {
  /** How long the pen takes to write the wordmark. */
  writeMs: 4500,
  /** How wide the wordmark is written, in points (narrower on a small phone). */
  writeWidth: 350,
  /** How much the letters drip: a multiplier on the rate. */
  drips: 2,
  /** How big each drip is: a multiplier. */
  dripSize: 0.6,
  /** How long a drop hangs under its letter before it falls. */
  hangMs: 240,
  /** How deep the pool pours in, as a percentage of the screen's height. */
  poolPct: 7,
  /** The pause after writing, before the letters fall. */
  pauseMs: 0,
  /** The delay after the letters pour in, before the pool erupts. */
  sinkMs: 0,
  /** How long the eruption takes to fill the screen. */
  splashMs: 1050,
  /** How long the screen stays full of water before it drains. */
  holdMs: 300,
  /** How long the water takes to fall away, revealing the page. */
  drainMs: 1200,
  /** The water's living body — its caustic light, colour and glints — together. */
  waterBody: 0.82,
  /** How soon and how far the letters melt into streams as they fall. */
  melt: 0.6,
  /** Inside the written letters: how much like the pool's water they are. */
  textWaterLikeness: 0.7,
  /** Inside the written letters: their sheen and glints. */
  textWaterShine: 0.95,
  /** Inside the written letters: the gleam that sweeps across the word. */
  textWaterGleam: 1,
  /** Inside the written letters: the pool's colour patches and bands. */
  textWaterColor: 2,
  /** How strong the colour is at the pool's and the eruption's edges. */
  poolEdgeColor: 0.3,
  /** How strong the colour is at the drips' edges. */
  dripEdgeColor: 0.5,
  /** How long the pool takes to pour in, from the bottom right, at the start. */
  pourMs: 1600,
  /** How much the landed drips raise the pool, apart from how clear they turn it. */
  waterVolumeFromDrip: 0.8,
  /** How long after the pool starts pouring in the pen starts writing. */
  textDrawStartAfterPoolEntry: 1650,
} as const;

export type WaterSettings = { readonly [K in keyof typeof WATER_SETTINGS]: number };
