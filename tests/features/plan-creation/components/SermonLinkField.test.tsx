import { fireEvent, render, screen } from "@tests/helpers/render";
import { lookWhenPressed } from "@tests/helpers/pressed";

import { SermonLinkField } from "@/features/plan-creation/components/SermonLinkField";
import { lightTheme } from "@/theme/tokens";

function renderField(invalid = false) {
  const onPaste = jest.fn();
  render(
    <SermonLinkField
      testID="link"
      value=""
      onChangeText={jest.fn()}
      onPaste={onPaste}
      invalid={invalid}
    />,
  );
  return { onPaste };
}

describe("SermonLinkField", () => {
  it("is the app's one-line field, 52 tall", () => {
    renderField();

    expect(screen.getByTestId("link-field")).toHaveStyle({
      minHeight: 52,
      borderColor: lightTheme.colors.containerBorder,
    });
  });

  it("holds Paste as a 40pt pill inside it, a 44pt tap all the same", () => {
    const { onPaste } = renderField();

    const paste = screen.getByTestId("link-paste-button");
    expect(paste).toHaveStyle({ height: 40 });
    expect(paste.props.hitSlop).toBe(2);
    fireEvent.press(paste);
    expect(onPaste).toHaveBeenCalledTimes(1);
  });

  it("doesn't change when pressed: no control in the app does", () => {
    renderField();

    expect(lookWhenPressed("link-paste-button")).toEqual(
      lookWhenPressed("link-paste-button", false),
    );
  });

  it("goes amber at its edge for a link that can't be used", () => {
    renderField(true);

    expect(screen.getByTestId("link-field")).toHaveStyle({
      borderColor: lightTheme.colors.incorrect,
    });
  });
});
