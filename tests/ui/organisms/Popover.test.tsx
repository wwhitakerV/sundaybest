import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";

import { Popover } from "@/ui/organisms/Popover";
import { SFProBody } from "@/ui/typography/SFProBody";

function popover(props: { visible?: boolean; onClose?: () => void } = {}) {
  render(
    <Popover
      visible={props.visible ?? true}
      onClose={props.onClose ?? (() => undefined)}
      anchor={{ top: 120, right: 16 }}
      width={280}
      accessibilityLabel="Reminder time"
      testID="a-popover"
    >
      <SFProBody>Inside</SFProBody>
    </Popover>,
  );
}

describe("Popover", () => {
  it("holds what it's given, named by its label", () => {
    popover();

    expect(screen.getByText("Inside")).toBeOnTheScreen();
    expect(screen.getByTestId("a-popover")).toHaveAccessibleName("Reminder time");
  });

  it("isn't there while closed", () => {
    popover({ visible: false });

    expect(screen.queryByTestId("a-popover")).toBeNull();
  });

  it("sits at its anchor, as wide as it's asked to be", () => {
    popover();

    expect(screen.getByTestId("a-popover")).toHaveStyle({ top: 120, right: 16, width: 280 });
  });

  it("hugs what it holds when it's given no width", () => {
    render(
      <Popover
        visible
        onClose={() => undefined}
        anchor={{ top: 120, right: 16 }}
        accessibilityLabel="Reminder time"
        testID="a-popover"
      >
        <SFProBody>Inside</SFProBody>
      </Popover>,
    );

    const style = StyleSheet.flatten(
      screen.getByTestId("a-popover").props.style as StyleProp<ViewStyle>,
    );
    expect(style.width).toBeUndefined();
  });

  it("is a plain group unless it's a menu", () => {
    popover();

    expect(screen.getByTestId("a-popover")).not.toHaveProp("accessibilityRole");
  });

  it("closes when the page around it is tapped", () => {
    const onClose = jest.fn<void, []>();
    popover({ onClose });

    // Hidden from VoiceOver, which closes it with the escape gesture instead.
    fireEvent.press(screen.getByTestId("a-popover-scrim", { includeHiddenElements: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
