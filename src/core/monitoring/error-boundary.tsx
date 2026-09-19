import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ErrorBoundaryProps as RouterErrorBoundaryProps } from "expo-router";

import { useTheme } from "@/theme";
import { crashReporter as defaultCrashReporter } from "./crash-reporter";
import { logger } from "./logger";
import type { CrashReporter } from "./crash-reporter";

/**
 * `ErrorBoundary` and `SuspenseFallback`, in the shape Expo Router expects
 * from a route file's exports: **function components**, not a
 * `children`-wrapping class. Router already catches the render error and
 * calls `Try` internally (`node_modules/expo-router/build/views/Try.d.ts`);
 * a route or layout that exports `ErrorBoundary` hands Router a component to
 * render instead of the crashed subtree, receiving `{ error, retry }`.
 */

export type ErrorBoundaryProps = RouterErrorBoundaryProps & {
  /** Defaults to the real crash reporter; overridable so tests never touch Sentry. */
  reporter?: CrashReporter;
};

/**
 * The screen Expo Router renders in place of a crashed route.
 *
 * Reports once per distinct error via an effect, not during render — render
 * can re-run (e.g. on a parent re-render before `retry` is called), and a
 * report belongs to the catch, not to every render of the fallback.
 */
export function ErrorBoundary({
  error,
  retry,
  reporter = defaultCrashReporter,
}: ErrorBoundaryProps) {
  const theme = useTheme();

  useEffect(() => {
    reporter.captureException(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reporter is a stable default; re-running per error identity is the point.
  }, [error]);

  return (
    <SafeAreaView
      testID="error-screen"
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Something went wrong</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          Please try again, or close and reopen the app.
        </Text>
        <Text
          accessibilityRole="button"
          testID="error-screen-retry"
          style={[styles.retry, { color: theme.colors.accent }]}
          onPress={() => void retry()}
        >
          Try again
        </Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Shown while a lazily-loaded route is still loading. Not a failure, so it
 * carries its own testID and none of the error screen's chrome. Logs a
 * breadcrumb-level message in non-production builds only, via the shared
 * logger, so a slow suspense boundary is visible in diagnostics without being
 * treated as an error.
 */
export function SuspenseFallback() {
  const theme = useTheme();

  useEffect(() => {
    logger.debug("suspense fallback shown");
  }, []);

  return (
    <SafeAreaView
      testID="suspense-fallback"
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>Loading…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  body: { fontSize: 15, textAlign: "center" },
  retry: { fontSize: 15, fontWeight: "600", marginTop: 8 },
});
