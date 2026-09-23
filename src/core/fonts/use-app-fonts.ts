import { useFonts } from "expo-font";

import { FONT_ASSETS } from "@/theme/fonts";

export type AppFontsState = {
  /** `false` until every font in `FONT_ASSETS` has finished loading. */
  loaded: boolean;
  error: Error | null;
};

/**
 * Loads every font this app declares (see `src/theme/fonts.ts`), once.
 *
 * `expo-font` is a side-effect SDK, so this wrapper lives in `src/core` per
 * `AGENTS.md` — `AppProviders` calls this and keeps the splash screen up
 * until `loaded` is `true`, so no screen ever renders with a fallback font
 * and then visibly swaps to the real one.
 */
export function useAppFonts(): AppFontsState {
  const [loaded, error] = useFonts(FONT_ASSETS);

  return { loaded, error };
}
