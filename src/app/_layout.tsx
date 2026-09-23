import { Stack } from "expo-router";

import { AppProviders } from "@/core/providers/AppProviders";
import { ErrorBoundary, SuspenseFallback } from "@/core/monitoring/error-boundary";
import { LoadingScreen } from "@/ui/LoadingScreen";

export default function RootLayout() {
  return (
    <AppProviders fallback={<LoadingScreen />}>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

// Expo Router recognises these named exports from a route file: ErrorBoundary
// replaces a crashed route's tree, SuspenseFallback covers a lazily-loaded
// one. See src/core/monitoring/error-boundary.tsx for the implementation and
// tests — this file stays a re-export per AGENTS.md's rule that src/app holds
// routes only.
export { ErrorBoundary, SuspenseFallback };
