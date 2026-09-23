import { lightTheme, type Theme } from "./tokens";

/**
 * Always resolves to the light theme. Dark mode is a deliberate future
 * feature with its own design, not a response to the OS colour scheme — the
 * app does not read `useColorScheme()` at all right now, so an iPhone in
 * dark mode has no effect on it.
 */
export function useTheme(): Theme {
  return lightTheme;
}
