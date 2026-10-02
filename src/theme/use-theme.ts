import { useContext } from "react";

import { ThemeContext } from "./theme-scope";
import type { Theme } from "./tokens";

/**
 * The theme to draw with: the light theme, or the one a surrounding
 * `ThemeScope` hands down (the Daily Study's reading paper). Dark mode is a
 * deliberate future feature with its own design, not a response to the OS
 * colour scheme — the app does not read `useColorScheme()` at all right now,
 * so an iPhone in dark mode has no effect on it.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
