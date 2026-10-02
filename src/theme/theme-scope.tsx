import { createContext, type ReactNode } from "react";

import { lightTheme, type Theme } from "./tokens";

/** The theme `useTheme()` reads: the light theme, unless a `ThemeScope` says otherwise. */
export const ThemeContext = createContext<Theme>(lightTheme);

export type ThemeScopeProps = {
  theme: Theme;
  children: ReactNode;
};

/** Everything inside reads `theme` from `useTheme()` — a page drawn on its own paper. */
export function ThemeScope({ theme, children }: ThemeScopeProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
