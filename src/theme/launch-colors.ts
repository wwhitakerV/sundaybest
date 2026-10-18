import launchColors from "./launch-colors.json";

/**
 * The launch's page: the red the paint intro's movie starts on (ADR 0030), and
 * the native launch screen's colour. It lives in JSON so `app.config.ts` reads
 * the same value, and the hand-over from the launch screen stays seamless. A
 * change reaches the native launch screen only with a new build.
 */
export const LAUNCH_PAGE: string = launchColors.page;
