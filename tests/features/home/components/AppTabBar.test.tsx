import { render, screen, fireEvent } from "@tests/helpers/render";
import { useIsFocused, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";
import { House, LibraryBig } from "lucide-react-native";

import { tapFeedback } from "@/core/haptics/haptics";
import { AppTabBar } from "@/features/home/components/AppTabBar";
import type { TabBarProps } from "@/ui/organisms/tab-bar/TabBar";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));
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

type AppTabBarProps = Parameters<typeof AppTabBar>[0];

function makeProps(): AppTabBarProps {
  const routes = [
    { key: "home-key", name: "home" },
    { key: "plans-key", name: "plans" },
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
  };

  return {
    state: { index: 0, routes } as unknown as TabBarProps["state"],
    descriptors: descriptors as unknown as TabBarProps["descriptors"],
    navigation: {
      navigate: mockNavigate,
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
    } as unknown as TabBarProps["navigation"],
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  };
}

describe("AppTabBar", () => {
  it("labels its floating button New plan", () => {
    render(<AppTabBar {...makeProps()} />);

    expect(screen.getByTestId("tab-bar-fab")).toHaveAccessibleName("New plan");
  });

  it("opens Paste Sermon when the floating button is pressed", () => {
    render(<AppTabBar {...makeProps()} />);

    fireEvent.press(screen.getByTestId("tab-bar-fab"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("gives tap feedback when the floating button is pressed", () => {
    render(<AppTabBar {...makeProps()} />);

    fireEvent.press(screen.getByTestId("tab-bar-fab"));

    expect(tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives tap feedback when a tab is pressed", () => {
    render(<AppTabBar {...makeProps()} />);

    fireEvent.press(screen.getByTestId("tab-plans"));

    expect(tapFeedback).toHaveBeenCalledTimes(1);
  });
});
