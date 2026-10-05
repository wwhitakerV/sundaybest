import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";

import { ApiProvider } from "@/core/api/ApiProvider";
import { initializePinning } from "@/core/api/pinning/pinning";
import { createQueryClient } from "@/core/api/query-client";
import { env } from "@/core/config/env";
import { useAppFonts } from "@/core/fonts/use-app-fonts";
import { AppStoreProvider } from "@/core/store/AppStoreProvider";
import { LaunchSplashCoordinator } from "./LaunchSplashCoordinator";
import { LegacyPreferencesBridge } from "./LegacyPreferencesBridge";
import { OfflineCacheHydrator } from "./OfflineCacheHydrator";
import { OfflineSyncProvider } from "./OfflineSyncProvider";
import { ServerPreferences } from "./ServerPreferences";

// The native splash is the only visible launch state. React renders behind it
// until LaunchSplashCoordinator confirms the initial destination/data are ready.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 260, fade: true });

export type AppProvidersProps = {
  children: ReactNode;
  /** Hidden behind the native splash while fonts/security are loading. */
  fallback?: ReactNode;
};

/** Single place every app-wide provider gets mounted. */
export function AppProviders({ children, fallback = null }: AppProvidersProps) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const { loaded, error } = useAppFonts();
  const fontsReady = loaded || error !== null;

  if (!fontsReady) return fallback;

  return (
    <NativeSecurityBootstrap fallback={fallback}>
      <QueryClientProvider client={queryClient}>
        <OfflineCacheHydrator>
          <ApiProvider>
            <OfflineSyncProvider>
              <ServerPreferences>
                <AppStoreProvider>
                  <LegacyPreferencesBridge />
                  <LaunchSplashCoordinator>{children}</LaunchSplashCoordinator>
                </AppStoreProvider>
              </ServerPreferences>
            </OfflineSyncProvider>
          </ApiProvider>
        </OfflineCacheHydrator>
      </QueryClientProvider>
    </NativeSecurityBootstrap>
  );
}

type SecurityState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "failed"; error: Error };

/**
 * Activates native transport security before any API provider is mounted.
 * Development intentionally skips pinning; preview/production fail closed.
 */
function NativeSecurityBootstrap({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [state, setState] = useState<SecurityState>(() =>
    env.variant === "development" ? { status: "ready" } : { status: "checking" },
  );

  useEffect(() => {
    if (env.variant === "development") return;

    let active = true;
    void initializePinning(env.variant, env.apiUrl)
      .then(() => {
        if (active) setState({ status: "ready" });
      })
      .catch(async (cause: unknown) => {
        // The coordinator is intentionally not mounted until security is ready,
        // so a startup failure would otherwise leave the native splash covering
        // Expo Router's error boundary forever. Hide it before surfacing the
        // render error.
        await SplashScreen.hideAsync().catch(() => undefined);
        if (!active) return;
        setState({
          status: "failed",
          error: cause instanceof Error ? cause : new Error("Native security startup failed"),
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "failed") throw state.error;
  if (state.status !== "ready") return fallback;
  return children;
}
