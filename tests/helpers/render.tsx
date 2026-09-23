import {
  render as renderWithoutProviders,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react-native";
import { renderRouter, type RenderRouterOptions } from "expo-router/testing-library";
import type { ReactElement, ReactNode } from "react";

import { AppProviders } from "@/core/providers/AppProviders";
import { LoadingScreen } from "@/ui/LoadingScreen";

function Providers({ children }: { children: ReactNode }) {
  return <AppProviders fallback={<LoadingScreen />}>{children}</AppProviders>;
}

/**
 * Renders a component inside the same provider tree the app mounts, so a unit
 * test cannot pass because it happened to skip a provider the real app has.
 *
 * Use this for component and screen tests. For anything that navigates or
 * depends on the current route, use `renderApp` instead.
 */
export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
  return renderWithoutProviders(ui, { ...options, wrapper: Providers });
}

/**
 * Renders the real route tree from `src/app` through Expo Router's testing
 * utilities, which is what makes route-level assertions meaningful: the routes
 * are discovered the same way the app discovers them, so a broken or renamed
 * route file fails the test.
 *
 * Returns Expo Router's result, which adds `getPathname()`,
 * `getSearchParams()`, and friends on top of RNTL's result.
 */
export function renderApp(options?: RenderRouterOptions) {
  return renderRouter("src/app", options);
}

// Re-exported so tests have a single import for rendering and querying.
export { screen, testRouter, act, fireEvent, waitFor, within } from "expo-router/testing-library";
