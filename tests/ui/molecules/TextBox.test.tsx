import { fireEvent, render, screen } from "@tests/helpers/render";

import { controlHeight, radius, space } from "@/theme";
import { lightTheme } from "@/theme/tokens";
import { TextBox } from "@/ui/molecules/TextBox";

const { colors } = lightTheme;

function boxWith(onChangeText = jest.fn()) {
  render(
    <TextBox
      testID="answer"
      accessibilityLabel="Your answer"
      value=""
      onChangeText={onChangeText}
      placeholder="Write what comes to mind"
      minHeight={124}
    />,
  );
  return screen.getByTestId("answer");
}

describe("TextBox", () => {
  it("is every box you write in: the fields' soft fill and card edge, 24pt corners", () => {
    expect(boxWith()).toHaveStyle({
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.containerBorder,
      borderRadius: radius[24],
      padding: space[16],
    });
  });

  it("is as tall as its place asks, at least, and starts its words at the top", () => {
    const box = boxWith();

    expect(box).toHaveStyle({ minHeight: 124, textAlignVertical: "top" });
    expect(box.props.multiline).toBe(true);
    expect(controlHeight.field).toBeLessThan(124);
  });

  it("says what to write in the supporting grey, as the fields do", () => {
    expect(boxWith().props.placeholderTextColor).toBe(colors.textSupporting);
  });

  it("passes what's typed on", () => {
    const onChangeText = jest.fn();
    fireEvent.changeText(boxWith(onChangeText), "Grace in the small things");

    expect(onChangeText).toHaveBeenCalledWith("Grace in the small things");
  });
});
