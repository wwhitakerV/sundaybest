import launchColors from "./launch-colors.json";

/**
 * The launch intros: the pool intro in water as a movie (ADR 0029), the water
 * intro as a movie (ADR 0028), the same drawn live with Skia (ADR 0027), and the
 * pool (ADR 0026).
 */
export type LaunchIntro = "pool-movie" | "movie" | "water" | "pool";

const INTROS: readonly LaunchIntro[] = ["pool-movie", "movie", "water", "pool"];

/**
 * Which intro plays, read from `launch-colors.json`'s `intro`: `"pool-movie"`,
 * `"movie"`, `"water"` or `"pool"` (the pool's movie if it names none of them).
 * Its colours come with it; each movie has the colours of the intro it films.
 */
export const LAUNCH_INTRO: LaunchIntro =
  INTROS.find((intro) => intro === launchColors.intro) ?? "pool-movie";

/** Whether the playing intro starts on the pool's red page. */
const ON_THE_POOL = LAUNCH_INTRO === "pool" || LAUNCH_INTRO === "pool-movie";

/**
 * The playing intro's colours, read from `launch-colors.json` — edit them there
 * to recolour the launch separately from the rest of the app. Each intro keeps
 * its own:
 *
 * - `page`: what the intro starts on, and the native launch screen.
 * - `ink`: the pool intro's writing, drips, pool and eruption; the red the water
 *   intro's pool starts as.
 *
 * They live in JSON so `app.config.ts` reads the same file: the native launch
 * screen is always the colour of the page the playing intro starts on, so the
 * hand-off stays seamless. A change to `page`, or to which intro plays, reaches
 * the launch screen only with a new build; a change to `ink` is JavaScript only.
 */
export const LAUNCH_COLORS: { readonly page: string; readonly ink: string } =
  launchColors[ON_THE_POOL ? "pool" : "water"];
