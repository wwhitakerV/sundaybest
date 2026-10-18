/**
 * The paint movie's settings, locked from its prototype
 * (`docs/prototypes/launch-intro-pool-paint.html`): the keys its Copy settings
 * gives, so a new set can be pasted straight in. Timings in milliseconds. The
 * movie is filmed with these (`npm run render:intro`); a test fails until it's
 * filmed again after a change.
 */
export const PAINT_MOVIE_SETTINGS = {
  /** The blank red screen before the stroke. */
  blankMs: 300,
  /** How long the stroke takes to sweep across. */
  swipeMs: 240,
  /** How long the stroke is, in points. */
  strokeLength: 470,
  /** How tall the stroke is, in points. */
  strokeHeight: 82,
  /** How long each letter takes to press up under the paint. */
  popMs: 260,
  /** The delay from one letter's press to the next's. */
  popStagger: 22,
  /** How long the paint sits before it runs. */
  wetMs: 0,
  /** How long the run takes to reach the pool. */
  runMs: 750,
  /** How long the top of the paint hangs on before it follows. */
  trailMs: 460,
  /** The wave in the run's front edge. */
  waviness: 1.9,
  /** The wobble along the run's edges. */
  wobble: 3,
  /** How much the run splits into streaks. */
  streaks: 1.7,
  /** How many drips are left dangling under the letters. */
  drips: 4,
  /** How much paint runs down. */
  runVolume: 0.1,
  /** How far apart the streaks' speeds are. */
  separation: 2,
  /** How much paint is in the dangling drips, all together. */
  dripVolume: 2.6,
  /** How fast the drips fall: a multiplier on their gravity. */
  dripSpeed: 0.45,
  /** How long a drip dangles before it lets go. */
  dripHangMs: 460,
  /** How thick the paint left on the letters is, in points. */
  coat: 1.6,
  /** How long that paint clings before it's drained off. */
  coatMs: 100,
  /** How far that paint slides down the letters. */
  slide: 0.95,
  /** The pause after the last drip, before the letters fall. */
  pauseMs: 300,
  /** How fast the letters fall: a multiplier on their gravity. */
  letterSpeed: 1,
  /** How deep the pool stands, as a percentage of the screen's height. */
  poolPct: 6,
  /** How wide the wordmark is, in points. */
  writeWidth: 350,
  /** The delay after the letters pour in, before the pool erupts. */
  sinkMs: 0,
  /** How long the eruption takes to fill the screen. */
  splashMs: 1050,
  /** How long the screen stays full white before the page. */
  holdMs: 200,
  /** How long the white takes to fade over the page: none, it's gone at once. */
  fadeMs: 0,
} as const;

export type PaintMovieSettings = { readonly [K in keyof typeof PAINT_MOVIE_SETTINGS]: number };
