import { renderHook } from "@testing-library/react-native";

import { lightTheme } from "./tokens";
import { useTheme } from "./use-theme";

type ColorScheme = "light" | "dark" | null;

const mockColorScheme = jest.fn<ColorScheme, []>();

/**
 * react-native's index exposes `useColorScheme` through a lazy
 * `require('./Libraries/Utilities/useColorScheme').default`, so mocking that
 * module is what actually reaches the hook.
 */
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

describe("useTheme", () => {
  it("resolves the light theme when the OS is in light mode", () => {
    mockColorScheme.mockReturnValue("light");

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(lightTheme);
  });

  /**
   * Dark mode is a deliberate future feature, not a fallback of the OS
   * setting — the app ignores `useColorScheme()` entirely for now rather
   * than tracking it, so there is nothing to resolve differently here.
   */
  it("resolves the light theme even when the OS is in dark mode", () => {
    mockColorScheme.mockReturnValue("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(lightTheme);
  });

  it("resolves the light theme when the OS expresses no preference", () => {
    mockColorScheme.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(lightTheme);
  });
});
