import { Modal } from "react-native";
import { Bell, Bookmark } from "lucide-react-native";
import { act, render, screen, fireEvent } from "@tests/helpers/render";

import { PopoverMenu, type PopoverMenuProps } from "@/ui/organisms/PopoverMenu";

type Props = Partial<PopoverMenuProps>;

function menu(props: Props = {}) {
  return (
    <PopoverMenu
      visible
      onClose={() => undefined}
      items={[
        { label: "Save plan", icon: Bookmark, onPress: () => undefined, testID: "item-save" },
        { label: "Daily reminder", icon: Bell, onPress: () => undefined, testID: "item-remind" },
      ]}
      anchor={{ top: 96, right: 20 }}
      accessibilityLabel="More"
      testID="a-menu"
      {...props}
    />
  );
}

describe("PopoverMenu", () => {
  it("is not rendered when not visible", () => {
    render(menu({ visible: false }));

    expect(screen.queryByTestId("a-menu")).toBeNull();
  });

  it("is a modal menu, named by its label", () => {
    render(menu());

    const node = screen.getByTestId("a-menu");
    expect(node).toHaveProp("accessibilityRole", "menu");
    expect(node).toHaveProp("accessibilityViewIsModal", true);
    expect(node).toHaveProp("accessibilityLabel", "More");
  });

  it("sits at its anchor", () => {
    render(menu({ anchor: { top: 120, right: 16 } }));

    expect(screen.getByTestId("a-menu")).toHaveStyle({ top: 120, right: 16 });
  });

  it("shows each item's label", () => {
    render(menu());

    expect(screen.getByText("Save plan")).toBeOnTheScreen();
    expect(screen.getByText("Daily reminder")).toBeOnTheScreen();
  });

  it("makes each item a menu item with its own testID", () => {
    render(menu());

    expect(screen.getByTestId("item-save")).toHaveProp("accessibilityRole", "menuitem");
    expect(screen.getByTestId("item-remind")).toHaveProp("accessibilityRole", "menuitem");
  });

  it("closes, and runs the item's action, once each when an item is pressed", () => {
    const onClose = jest.fn();
    const onPress = jest.fn();
    render(
      menu({
        onClose,
        items: [{ label: "Save plan", icon: Bookmark, onPress, testID: "item-save" }],
      }),
    );

    fireEvent.press(screen.getByTestId("item-save"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("closes when the scrim is tapped", () => {
    const onClose = jest.fn();
    render(menu({ onClose }));

    fireEvent.press(screen.getByTestId("a-menu-scrim", { includeHiddenElements: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on the accessibility escape gesture", () => {
    const onClose = jest.fn();
    render(menu({ onClose }));

    fireEvent(screen.getByTestId("a-menu"), "accessibilityEscape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves its animating to itself, not the Modal", () => {
    render(menu());

    expect(screen.UNSAFE_getByType(Modal).props).toHaveProperty("animationType", "none");
  });

  describe("leaving", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    // Staying mounted while it fades is `usePresence`'s, tested there: this
    // helper's Expo Router testing library runs Reanimated's mock, where every
    // animation ends at once.
    it("is gone once its exit has run after it is closed", () => {
      jest.useFakeTimers();
      const { rerender } = render(menu());

      rerender(menu({ visible: false }));
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId("a-menu", { includeHiddenElements: true })).toBeNull();
    });
  });
});
