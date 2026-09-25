import { Pressable, Text } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useIsFocused } from "expo-router";
import type * as ExpoRouter from "expo-router";

import {
  TabBarAccessoryProvider,
  useShownTabBarAccessory,
  useTabBarAccessory,
} from "@/ui/tab-bar/tab-bar-accessory";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useIsFocused: jest.fn(),
}));

/** Stands in for the tab bar: shows what's been asked of it. */
function BarProbe() {
  const accessory = useShownTabBarAccessory();
  return accessory ? (
    <Pressable testID="probe-accessory" onPress={accessory.onPress}>
      <Text>{accessory.label}</Text>
    </Pressable>
  ) : (
    <Text testID="probe-accessory">none</Text>
  );
}

/** Stands in for a screen asking the tab bar to minimise beside its button. */
function ScreenAsking({ show, onPress }: { show: boolean; onPress: () => void }) {
  useTabBarAccessory({ label: "Continue Day 2", testID: "a-continue", onPress }, show);
  return null;
}

function tree(show: boolean, onPress: () => void, mounted = true) {
  return (
    <TabBarAccessoryProvider>
      {mounted && <ScreenAsking show={show} onPress={onPress} />}
      <BarProbe />
    </TabBarAccessoryProvider>
  );
}

beforeEach(() => {
  jest.mocked(useIsFocused).mockReturnValue(true);
});

describe("tab bar accessory", () => {
  it("puts a screen's button in the tab bar while it asks", () => {
    render(tree(true, () => undefined));

    expect(screen.getByText("Continue Day 2")).toBeOnTheScreen();
  });

  it("leaves the tab bar alone while it doesn't", () => {
    render(tree(false, () => undefined));

    expect(screen.getByTestId("probe-accessory")).toHaveTextContent("none");
  });

  it("takes the button back when the screen stops asking", () => {
    const view = render(tree(true, () => undefined));

    view.rerender(tree(false, () => undefined));

    expect(screen.getByTestId("probe-accessory")).toHaveTextContent("none");
  });

  it("takes it back when the screen goes away", () => {
    const view = render(tree(true, () => undefined));

    view.rerender(tree(true, () => undefined, false));

    expect(screen.getByTestId("probe-accessory")).toHaveTextContent("none");
  });

  it("only while the screen asking is the one shown", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);
    render(tree(true, () => undefined));

    expect(screen.getByTestId("probe-accessory")).toHaveTextContent("none");
  });

  it("does what the screen's button does now, not what it did when first asked", () => {
    const first = jest.fn();
    const latest = jest.fn();
    const view = render(tree(true, first));
    view.rerender(tree(true, latest));

    fireEvent.press(screen.getByTestId("probe-accessory"));

    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
