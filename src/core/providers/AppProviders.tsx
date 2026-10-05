import { useMemo, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import { ApiProvider } from "@/core/api/ApiProvider";
import { createQueryClient } from "@/core/api/query-client";
import { useAppFonts } from "@/core/fonts/use-app-fonts";
import { PlanBuilder } from "@/core/plan-builder";
import { AppStoreProvider } from "@/core/store";
import { LaunchSplashCoordinator } from "./LaunchSplashCoordinator";
import { LegacyPreferencesBridge } from "./LegacyPreferencesBridge";
import { OfflineCacheHydrator } from "./OfflineCacheHydrator";
import { OfflineSyncProvider } from "./OfflineSyncProvider";
import { ServerPreferences } from "./ServerPreferences";

// Side-effect import. `env.ts` validates and freezes the environment at module
// scope, so importing it from the composition root is what makes a misconfigured
// build fail at launch.
import "@/core/config/env";

// The native splash is the only visible launch state. React renders behind it
// until LaunchSplashCoordinator confirms the initial destination/data are ready.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 260, fade: true });

export type AppProvidersProps = {
  children: ReactNode;
  /** Hidden behind the native splash while fonts are loading. */
  fallback?: ReactNode;
};

/** Single place every app-wide provider gets mounted. */
export function AppProviders({ children, fallback = null }: AppProvidersProps) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const { loaded, error } = useAppFonts();
  const fontsReady = loaded || error !== null;

  if (!fontsReady) return fallback;

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineCacheHydrator>
        <ApiProvider>
          <OfflineSyncProvider>
            <ServerPreferences>
              <AppStoreProvider>
                <LegacyPreferencesBridge />
                <PlanBuilder />
                <LaunchSplashCoordinator>{children}</LaunchSplashCoordinator>
              </AppStoreProvider>
            </ServerPreferences>
          </OfflineSyncProvider>
        </ApiProvider>
      </OfflineCacheHydrator>
    </QueryClientProvider>
  );
}
