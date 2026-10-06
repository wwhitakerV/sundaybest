import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { AppProviders } from "@/core/providers/AppProviders";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(undefined),
  setOptions: jest.fn(),
}));

const mockUseFonts = jest.mocked(useFonts);
const mockHideAsync = jest.mocked(SplashScreen.hideAsync);

// A plain stand-in, not the real LoadingScreen — this file tests AppProviders'
// own fallback-vs-children logic in isolation. LoadingScreen has its own test.
const fallback = <Text>loading</Text>;

describe("AppProviders", () => {
  it("renders children once fonts have loaded", () => {
    mockUseFonts.mockReturnValue([true, null]);

    render(
      <AppProviders fallback={fallback} offlineCache={[]}>
        <Text>ready</Text>
      </AppProviders>,
    );

    expect(screen.getByText("ready")).toBeVisible();
  });

  it("renders the fallback instead of children while fonts are still loading", () => {
    mockUseFonts.mockReturnValue([false, null]);

    render(
      <AppProviders fallback={fallback}>
        <Text>ready</Text>
      </AppProviders>,
    );

    expect(screen.queryByText("ready")).toBeNull();
    expect(screen.getByText("loading")).toBeVisible();
  });

  it("does not hide the splash screen while fonts are still loading", () => {
    mockUseFonts.mockReturnValue([false, null]);

    render(
      <AppProviders fallback={fallback}>
        <Text>ready</Text>
      </AppProviders>,
    );

    expect(mockHideAsync).not.toHaveBeenCalled();
  });

  /**
   * A font that fails to load must not hold the app back — it renders anyway
   * rather than trapping the user behind a permanent loading screen. (Hiding
   * the splash is `LaunchSplashCoordinator`'s job, once launch data is in.)
   */
  it("renders children even if a font failed to load", () => {
    mockUseFonts.mockReturnValue([false, new Error("font file missing")]);

    render(
      <AppProviders fallback={fallback} offlineCache={[]}>
        <Text>ready</Text>
      </AppProviders>,
    );

    expect(screen.getByText("ready")).toBeVisible();
  });
});
