import { Stack } from "expo-router";

import { AppProviders } from "@/core/providers/AppProviders";
import { ErrorBoundary, SuspenseFallback } from "@/core/monitoring/error-boundary";
import { LoadingScreen } from "@/ui/LoadingScreen";
import { HeaderArrivalProvider } from "@/ui/HeaderArrivalProvider";
import { headerEntranceLayout } from "@/ui/HeaderEntranceScope";

/**
 * The tab bar's root screens. Header buttons animate in whenever the app
 * arrives at a screen — except moving between two of these. A tab with its own
 * stack is also named bare, as it reads for a moment before that stack opens.
 */
const TAB_ROOTS = [
  "(tabs)/home/index",
  "(tabs)/home",
  "(tabs)/plans/index",
  "(tabs)/plans",
  "(tabs)/fun",
  "(tabs)/progress",
];

export default function RootLayout() {
  return (
    <AppProviders fallback={<LoadingScreen />}>
      <HeaderArrivalProvider tabRoots={TAB_ROOTS}>
        <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout}>
          {/*
           * Declared first so Welcome stays the initial route: explicitly listed
           * screens are registered ahead of auto-discovered ones.
           */}
          <Stack.Screen name="index" />
          {/*
           * The Daily Study session — study, Day Complete, Quick Check — is one
           * native full-screen modal with its own stack. Screens inside it push
           * normally; leaving it dismisses the whole modal in one slide down,
           * back to whatever screen opened it.
           */}
          <Stack.Screen name="study" options={{ presentation: "fullScreenModal" }} />
          {/*
           * New Plan — its two steps, Preparing, and Ready — is the same kind of
           * full-screen modal: it slides up over whatever opened it.
           */}
          <Stack.Screen name="(plan-creation)" options={{ presentation: "fullScreenModal" }} />
        </Stack>
      </HeaderArrivalProvider>
    </AppProviders>
  );
}

// Expo Router recognises these named exports from a route file: ErrorBoundary
// replaces a crashed route's tree, SuspenseFallback covers a lazily-loaded
// one. See src/core/monitoring/error-boundary.tsx for the implementation and
// tests — this file stays a re-export per AGENTS.md's rule that src/app holds
// routes only.
export { ErrorBoundary, SuspenseFallback };
