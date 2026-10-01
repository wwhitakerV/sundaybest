import { fireEvent, render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { TextField } from "@/ui/typography/TextField";

const { typography, colors } = lightTheme;

describe("TextField", () => {
  it("sets the body type", () => {
    render(<TextField testID="field" />);

    expect(screen.getByTestId("field")).toHaveStyle(typography.body);
  });

  it("sets the text colour", () => {
    render(<TextField testID="field" />);

    expect(screen.getByTestId("field")).toHaveStyle({ color: colors.text });
  });

  it("sets the placeholder in the muted colour", () => {
    render(<TextField testID="field" placeholder="Your name" />);

    expect(screen.getByTestId("field").props.placeholderTextColor).toBe(colors.textMuted);
  });

  it("shows the value it is given", () => {
    render(<TextField testID="field" value="Ruth" />);

    expect(screen.getByDisplayValue("Ruth")).toBeOnTheScreen();
  });

  it("reports typed text through onChangeText", () => {
    const onChangeText = jest.fn();
    render(<TextField testID="field" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByTestId("field"), "Naomi");

    expect(onChangeText).toHaveBeenCalledWith("Naomi");
  });

  it("forwards multiline", () => {
    render(<TextField testID="field" multiline />);

    expect(screen.getByTestId("field").props.multiline).toBe(true);
  });

  it("forwards accessibilityLabel", () => {
    render(<TextField testID="field" accessibilityLabel="Prayer request" />);

    expect(screen.getByLabelText("Prayer request")).toBeOnTheScreen();
  });

  it("applies a layout style on top of the body type", () => {
    render(<TextField testID="field" style={{ borderWidth: 1, padding: 8 }} />);

    expect(screen.getByTestId("field")).toHaveStyle({
      borderWidth: 1,
      padding: 8,
      ...typography.body,
    });
  });
});
