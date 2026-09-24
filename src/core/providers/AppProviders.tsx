import { useEffect, useMemo, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import { createQueryClient } from "@/core/api/query-client";
import { useAppFonts } from "@/core/fonts/use-app-fonts";
import { AppStoreProvider } from "@/core/store";

// Side-effect import. `env.ts` validates and freezes the environment at module
// scope, so importing it from the composition root is what makes a misconfigured
// build fail at launch. Without a reachable import Metro drops the module from
// the bundle and the startup check silently never runs.
import "@/core/config/env";

// Must run at module scope, not inside the component — expo-splash-screen's
// own docs warn that calling this inside a component or hook can run too
// late, after the splash screen has already auto-hidden. This module is the
// first thing `src/app/_layout.tsx` imports, so it runs before any component
// in the tree does.
void SplashScreen.preventAutoHideAsync();

export type AppProvidersProps = {
  children: ReactNode;
  /**
   * Shown in place of `children` while fonts are still loading. Taken as a
   * prop rather than imported directly: `core` may not import `ui` (see
   * `src/core/README.md`), so the caller — `src/app/_layout.tsx` — supplies
   * it.
   */
  fallback: ReactNode;
};

/**
 * Single place every app-wide provider gets mounted — including the app
 * store (`@/core/store`), the single source of truth for application state.
 *
 * Integrity monitoring is deliberately **not** mounted here yet. It needs a
 * session to clear and a monitoring sink to report to, and neither is wired up —
 * `src/core/security/integrity` is ready for whichever prompt does that.
 *
 * Holds the native splash screen up until the app's fonts
 * (`src/theme/fonts.ts`) have loaded, rendering `fallback` in the gap between
 * the native splash handing off to JS and the fonts finishing, so no screen
 * ever renders with a fallback font and then visibly swaps to the real one.
 * A font that fails to load does not trap the app behind the splash screen
 * forever — `error` from `useAppFonts` still counts as "done trying," and
 * the app renders with whatever fell back regardless.
 */
export function AppProviders({ children, fallback }: AppProvidersProps) {
  // One client for the life of the app. Rebuilding it on a re-render would
  // throw away every cached query and every in-flight request.
  const queryClient = useMemo(() => createQueryClient(), []);
  const { loaded, error } = useAppFonts();
  const ready = loaded || error !== null;

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return fallback;

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>{children}</AppStoreProvider>
    </QueryClientProvider>
  );
}
