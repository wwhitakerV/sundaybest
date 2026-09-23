import { render, screen, fireEvent } from "@tests/helpers/render";
import { useIsFocused, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";
import { House, LibraryBig } from "lucide-react-native";

import { TabBar } from "@/ui/tab-bar/TabBar";
import type { TabBarProps } from "@/ui/tab-bar/TabBar";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useIsFocused: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.mocked(useIsFocused).mockReturnValue(true);
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

function makeProps(activeIndex: number, options?: { includeHiddenRoute?: boolean }): TabBarProps {
  const routes = [
    { key: "home-key", name: "home" },
    { key: "plans-key", name: "plans" },
    ...(options?.includeHiddenRoute ? [{ key: "settings-key", name: "settings" }] : []),
  ];

  const descriptors = {
    "home-key": {
      options: {
        title: "Home",
        tabBarButtonTestID: "tab-home",
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <House color={color} size={size} />
        ),
      },
    },
    "plans-key": {
      options: {
        title: "Plans",
        tabBarButtonTestID: "tab-plans",
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <LibraryBig color={color} size={size} />
        ),
      },
    },
    ...(options?.includeHiddenRoute
      ? {
          "settings-key": {
            options: {
              title: "Settings",
              tabBarButtonTestID: "tab-settings",
              // Mirrors what Expo Router's `href: null` shortcut unwinds
              // into before a custom `tabBar` sees the descriptor.
              tabBarButton: () => null,
            },
          },
        }
      : {}),
  };

  return {
    state: { index: activeIndex, routes } as unknown as TabBarProps["state"],
    descriptors: descriptors as unknown as TabBarProps["descriptors"],
    navigation: {
      navigate: mockNavigate,
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
    } as unknown as TabBarProps["navigation"],
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  };
}

// The bar starts in its hidden position (opacity 0) and animates in, and the
// Jest Reanimated mock freezes animated styles at that first frame — so these
// assert presence (`toBeOnTheScreen`), not `toBeVisible`.
describe("TabBar", () => {
  it("is addressable as tab-bar", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar")).toBeOnTheScreen();
  });

  it("renders a button for every route", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-home")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-plans")).toBeOnTheScreen();
  });

  it("navigates to a route when its tab is pressed", () => {
    render(<TabBar {...makeProps(0)} />);

    fireEvent.press(screen.getByTestId("tab-plans"));

    expect(mockNavigate).toHaveBeenCalledWith("plans");
  });

  it("renders the add-sermon FAB", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar-fab")).toBeOnTheScreen();
  });

  it("navigates to New Plan — Paste Sermon when the FAB is pressed", () => {
    render(<TabBar {...makeProps(0)} />);

    fireEvent.press(screen.getByTestId("tab-bar-fab"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("does not render a tab for a route hidden via href: null", () => {
    render(<TabBar {...makeProps(0, { includeHiddenRoute: true })} />);

    expect(screen.getByTestId("tab-home")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-plans")).toBeOnTheScreen();
    expect(screen.queryByTestId("tab-settings")).toBeNull();
  });

  it("starts in its hidden position so it can animate in", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar")).toHaveStyle({ opacity: 0 });
  });

  it("ignores touches while the tabs are covered by another screen", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar")).toHaveStyle({ pointerEvents: "none" });
  });

  it("marks no tab as selected while a route without a tab is focused", () => {
    render(<TabBar {...makeProps(2, { includeHiddenRoute: true })} />);

    expect(screen.getByTestId("tab-home")).toHaveProp("accessibilityState", { selected: false });
    expect(screen.getByTestId("tab-plans")).toHaveProp("accessibilityState", { selected: false });
  });
});
