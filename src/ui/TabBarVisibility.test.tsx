import { render, screen } from "@test/render";
import { render as renderWithoutProviders } from "@testing-library/react-native";
import { Text } from "react-native";

import { TabBarVisibilityProvider, useHideTabBar, useTabBarVisible } from "./TabBarVisibility";

function VisibilityReporter() {
  const visible = useTabBarVisible();
  return <Text>{visible ? "visible" : "hidden"}</Text>;
}

function HidingScreen() {
  useHideTabBar();
  return <Text>hiding screen</Text>;
}

describe("TabBarVisibility", () => {
  it("defaults to visible", () => {
    render(
      <TabBarVisibilityProvider>
        <VisibilityReporter />
      </TabBarVisibilityProvider>,
    );

    expect(screen.getByText("visible")).toBeVisible();
  });

  it("hides while a screen calling useHideTabBar is mounted", () => {
    render(
      <TabBarVisibilityProvider>
        <VisibilityReporter />
        <HidingScreen />
      </TabBarVisibilityProvider>,
    );

    expect(screen.getByText("hidden")).toBeVisible();
  });

  it("restores visibility once the hiding screen unmounts", () => {
    const { rerender } = render(
      <TabBarVisibilityProvider>
        <VisibilityReporter />
        <HidingScreen />
      </TabBarVisibilityProvider>,
    );

    expect(screen.getByText("hidden")).toBeVisible();

    rerender(
      <TabBarVisibilityProvider>
        <VisibilityReporter />
      </TabBarVisibilityProvider>,
    );

    expect(screen.getByText("visible")).toBeVisible();
  });

  it("throws when used outside the provider", () => {
    // `@test/render`'s own `render` wraps every test in the app's full
    // provider tree (including this one), so proving the "no provider"
    // case needs RNTL's raw render instead, without that wrapper.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderWithoutProviders(<VisibilityReporter />)).toThrow(
      "useTabBarVisibility must be used within a TabBarVisibilityProvider",
    );

    consoleError.mockRestore();
  });
});
