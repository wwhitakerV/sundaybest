import { render, screen, fireEvent } from "@tests/helpers/render";
import { useIsFocused, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";
import { House, LibraryBig } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { getFloatingNavBarBottom } from "@/ui/floatingNavBar";
import { TabBar } from "@/ui/tab-bar/TabBar";
import type { TabBarProps } from "@/ui/tab-bar/TabBar";
import { TabBarAccessoryProvider, useTabBarAccessory } from "@/ui/tab-bar/tab-bar-accessory";

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

  it("sits its capsule where every floating bar's goes, centred on the add-sermon button", () => {
    render(<TabBar {...makeProps(0)} />);

    // The capsule is 4pt shorter than the button, so its bottom's 2pt above the row's.
    expect(screen.getByTestId("tab-bar")).toHaveStyle({
      paddingBottom: getFloatingNavBarBottom(0) - 2,
    });
  });

  it("lets touches through everywhere but its own controls", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar")).toHaveStyle({ pointerEvents: "box-none" });
  });

  it("tints what scrolls under it", () => {
    render(<TabBar {...makeProps(0)} />);

    expect(screen.getByTestId("tab-bar-tint")).toBeOnTheScreen();
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

  describe("minimised beside a screen's button", () => {
    function AskingScreen({ onPress }: { onPress: () => void }) {
      useTabBarAccessory({ label: "Continue Day 2", testID: "plan-continue", onPress }, true);
      return null;
    }

    function renderMinimised(onPress: () => void = () => undefined) {
      return render(
        <TabBarAccessoryProvider>
          <AskingScreen onPress={onPress} />
          <TabBar {...makeProps(1)} />
        </TabBarAccessoryProvider>,
      );
    }

    it("shows the screen's button in the middle, in the bar's own pill", () => {
      renderMinimised();

      expect(screen.getByTestId("plan-continue")).toBeOnTheScreen();
      expect(screen.getByText("Continue Day 2")).toBeOnTheScreen();
    });

    it("does what the screen's button does", () => {
      const onPress = jest.fn();
      renderMinimised(onPress);

      fireEvent.press(screen.getByTestId("plan-continue"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("gathers the tabs into one — the active one — in a circle", () => {
      renderMinimised();

      expect(screen.getByTestId("tab-bar-collapsed")).toHaveAccessibleName("Plans");
    });

    it("keeps the add-sermon button where it is", () => {
      renderMinimised();

      expect(screen.getByTestId("tab-bar-fab")).toBeOnTheScreen();
    });

    it("highlights the gathered tab in a circle, as tall as the open bar's highlight", () => {
      renderMinimised();

      expect(screen.getByTestId("tab-bar-collapsed-indicator")).toHaveStyle({
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: lightTheme.colors.tabActiveBackground,
      });
    });

    it("edges the screen's button more heavily than the bar", () => {
      renderMinimised();

      expect(screen.getByTestId("plan-continue")).toHaveStyle({
        borderColor: lightTheme.colors.borderStrong,
      });
    });

    describe("once the gathered tab is tapped", () => {
      it("opens the tabs back out, to be pressed again", () => {
        renderMinimised();

        fireEvent.press(screen.getByTestId("tab-bar-collapsed"));
        fireEvent.press(screen.getByTestId("tab-home"));

        expect(screen.getByTestId("tab-bar-collapsed")).toHaveProp("pointerEvents", "none");
        expect(mockNavigate).toHaveBeenCalledWith("home");
      });

      it("goes nowhere itself", () => {
        renderMinimised();

        fireEvent.press(screen.getByTestId("tab-bar-collapsed"));

        expect(mockNavigate).not.toHaveBeenCalled();
      });

      it("keeps the screen's button, raised above the tabs, doing what it does", () => {
        const onPress = jest.fn();
        renderMinimised(onPress);

        fireEvent.press(screen.getByTestId("tab-bar-collapsed"));
        fireEvent.press(screen.getByTestId("plan-continue"));

        expect(screen.getByText("Continue Day 2")).toBeOnTheScreen();
        expect(onPress).toHaveBeenCalledTimes(1);
      });

      it("gathers again when the screen next asks", () => {
        function TogglingScreen({ asking }: { asking: boolean }) {
          useTabBarAccessory(
            { label: "Continue Day 2", testID: "plan-continue", onPress: () => undefined },
            asking,
          );
          return null;
        }
        const ui = (asking: boolean) => (
          <TabBarAccessoryProvider>
            <TogglingScreen asking={asking} />
            <TabBar {...makeProps(1)} />
          </TabBarAccessoryProvider>
        );
        const { rerender } = render(ui(true));

        fireEvent.press(screen.getByTestId("tab-bar-collapsed"));
        rerender(ui(false));
        rerender(ui(true));

        expect(screen.getByTestId("tab-bar-collapsed")).toHaveProp("pointerEvents", "auto");
      });
    });

    it("shows no button, and the tabs as usual, while no screen asks", () => {
      render(
        <TabBarAccessoryProvider>
          <TabBar {...makeProps(1)} />
        </TabBarAccessoryProvider>,
      );

      expect(screen.queryByText("Continue Day 2")).toBeNull();
      expect(screen.getByTestId("tab-bar-collapsed")).toHaveProp("pointerEvents", "none");
    });
  });
});
