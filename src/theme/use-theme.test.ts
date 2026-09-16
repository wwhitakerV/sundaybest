import { renderHook } from "@testing-library/react-native";

import { darkTheme, lightTheme } from "./tokens";
import { useTheme } from "./use-theme";

type ColorScheme = "light" | "dark" | null;

const mockColorScheme = jest.fn<ColorScheme, []>();

/**
 * react-native's index exposes `useColorScheme` through a lazy
 * `require('./Libraries/Utilities/useColorScheme').default`, so mocking that
 * module is what actually reaches the hook.
 *
 * `Appearance.setColorScheme()` looks like the tidier public API but is a no-op
 * here: jest-expo mocks the native Appearance module, so nothing observes the
 * change and the hook keeps returning the default.
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

  it("resolves the dark theme when the OS is in dark mode", () => {
    mockColorScheme.mockReturnValue("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(darkTheme);
  });

  it("falls back to the light theme when the OS expresses no preference", () => {
    mockColorScheme.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(lightTheme);
  });

  it("gives light and dark genuinely different colours", () => {
    expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    expect(lightTheme.colors.text).not.toBe(darkTheme.colors.text);
  });
});
