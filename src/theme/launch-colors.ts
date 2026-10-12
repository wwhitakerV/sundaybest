import launchColors from "./launch-colors.json";

/**
 * The launch's colours, read from `launch-colors.json` — edit them there to
 * recolour the launch separately from the rest of the app:
 *
 * - `page`: the page the intro writes on, and the native launch screen.
 * - `ink`: the writing, the drips, the pool, the eruption that fills the screen.
 *
 * They live in JSON so `app.config.ts` reads the same file: the native launch
 * screen is always the colour of the page the intro writes on, so the hand-off
 * stays seamless. A change to `page` reaches the launch screen only with a new
 * build; a change to `ink` is JavaScript only.
 */
export const LAUNCH_COLORS: { readonly page: string; readonly ink: string } = launchColors;
