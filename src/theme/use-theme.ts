import { useColorScheme } from "react-native";

import { darkTheme, lightTheme, type Theme } from "./tokens";

/** Resolves the active theme from the OS colour scheme. */
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}
