import { Modal, Text } from "react-native";
import { act, render, screen, fireEvent } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";

import { BottomSheet } from "@/ui/organisms/BottomSheet";

function sheet(props: { visible: boolean; onClose?: () => void }) {
  return (
    <BottomSheet
      visible={props.visible}
      onClose={props.onClose ?? (() => undefined)}
      testID="a-sheet"
      accessibilityLabel="Reading settings"
    >
      <Text>Inside the sheet</Text>
    </BottomSheet>
  );
}

describe("BottomSheet", () => {
  it("shows its children when visible", () => {
    render(sheet({ visible: true }));

    expect(screen.getByTestId("a-sheet")).toBeVisible();
    expect(screen.getByText("Inside the sheet")).toBeVisible();
  });

  it("is not rendered when not visible", () => {
    render(sheet({ visible: false }));

    expect(screen.queryByTestId("a-sheet")).toBeNull();
    expect(screen.queryByText("Inside the sheet")).toBeNull();
  });

  // The scrim is hidden from VoiceOver (the sheet is modal to it), so it's
  // found among hidden elements; a tap still lands on it.
  it("calls onClose when the scrim is tapped", () => {
    const onClose = jest.fn();
    render(sheet({ visible: true, onClose }));

    fireEvent.press(screen.getByTestId("a-sheet-scrim", { includeHiddenElements: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the sheet itself is tapped", () => {
    const onClose = jest.fn();
    render(sheet({ visible: true, onClose }));

    fireEvent.press(screen.getByText("Inside the sheet"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("marks the sheet as modal to a screen reader, and names it", () => {
    render(sheet({ visible: true }));

    expect(screen.getByTestId("a-sheet")).toHaveProp("accessibilityViewIsModal", true);
    expect(screen.getByTestId("a-sheet")).toHaveProp("accessibilityLabel", "Reading settings");
  });

  it("shows its label as a title inside the sheet", () => {
    render(sheet({ visible: true }));

    expect(screen.getByRole("header", { name: "Reading settings" })).toBeVisible();
  });

  it("calls onClose on the accessibility escape gesture", () => {
    const onClose = jest.fn();
    render(sheet({ visible: true, onClose }));

    fireEvent(screen.getByTestId("a-sheet"), "accessibilityEscape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves its animating to itself, not the Modal", () => {
    render(sheet({ visible: true }));

    expect(screen.UNSAFE_getByType(Modal).props).toHaveProperty("animationType", "none");
  });

  it("sets its grabber 14pt below its top edge", () => {
    render(sheet({ visible: true }));

    expect(screen.getByTestId("a-sheet", { includeHiddenElements: true })).toHaveStyle({
      paddingTop: 14,
    });
  });

  it("draws its grabber in the grabber colour", () => {
    render(sheet({ visible: true }));

    expect(screen.getByTestId("a-sheet-grabber", { includeHiddenElements: true })).toHaveStyle({
      backgroundColor: lightTheme.colors.grabber,
    });
  });

  describe("leaving", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    // Staying mounted while it slides away is `usePresence`'s, tested there:
    // this helper's Expo Router testing library runs Reanimated's mock, where
    // every animation ends at once.
    it("is gone once its exit has run", () => {
      jest.useFakeTimers();
      const { rerender } = render(sheet({ visible: true }));

      rerender(sheet({ visible: false }));
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId("a-sheet", { includeHiddenElements: true })).toBeNull();
    });
  });
});
