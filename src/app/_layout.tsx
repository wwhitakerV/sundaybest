import { Stack } from "expo-router";

import { AppProviders } from "@/core/providers/AppProviders";
import { ErrorBoundary, SuspenseFallback } from "@/core/monitoring/error-boundary";
import { HeaderArrivalProvider } from "@/ui/header-entrance/HeaderArrivalProvider";
import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";
import { HALF_SHEET_OPTIONS } from "@/ui/SheetLayout";

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
  "(tabs)/fun/index",
  "(tabs)/fun",
  "(tabs)/progress",
  "(tabs)/settings/index",
  "(tabs)/settings",
];

export default function RootLayout() {
  return (
    <AppProviders>
      <HeaderArrivalProvider tabRoots={TAB_ROOTS}>
        <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout}>
          {/*
           * Declared first so Welcome stays the initial route: explicitly listed
           * screens are registered ahead of auto-discovered ones.
           */}
          <Stack.Screen name="index" />
          {/*
           * Tabs are the app's settled root. There is no card transition from
           * the launch/onboarding route into them; on a cold return the native
           * splash fades onto an already-mounted Home screen instead of exposing
           * a root-stack slide underneath it. Tab-to-tab/navigation animations
           * inside this navigator are unaffected.
           */}
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          {/*
           * The Daily Study session — study, Day Complete, Quick Check — is one
           * native full-screen modal with its own stack. Screens inside it push
           * normally; leaving it dismisses the whole modal in one slide down,
           * back to whatever screen opened it.
           */}
          <Stack.Screen name="study" options={{ presentation: "fullScreenModal" }} />
          {/*
           * New Plan — its two steps — is the same kind of full-screen modal:
           * it slides up over whatever opened it, and closes the moment the
           * plan is asked for.
           */}
          <Stack.Screen name="(plan-creation)" options={{ presentation: "fullScreenModal" }} />
          {/*
           * The plan being built, step by step: a native half-height sheet
           * over wherever the reader is, opened from the generation bar.
           */}
          <Stack.Screen name="generation" options={HALF_SHEET_OPTIONS} />
          {/*
           * A theology exam attempt — the questions, its results, and
           * Understand why — is another full-screen modal with its own stack,
           * over the exam's overview. The overview itself (`exams/[examId]/index`)
           * is an ordinary push above the tabs, so the tab bar steps aside.
           */}
          <Stack.Screen name="exam" options={{ presentation: "fullScreenModal" }} />
          {/*
           * An exam's topics and passages open over its overview as native
           * half-height sheets: iOS draws the grabber, and a drag down or a
           * tap on the dimmed overview above closes them.
           */}
          <Stack.Screen name="exams/[examId]/topics" options={HALF_SHEET_OPTIONS} />
          <Stack.Screen name="exams/[examId]/passages" options={HALF_SHEET_OPTIONS} />
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
