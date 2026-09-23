import { render, screen, fireEvent } from "@tests/helpers/render";

import { Button } from "@/ui/Button";

describe("Button", () => {
  it("forwards testID to the outermost pressable", () => {
    render(<Button testID="a-button" label="Press me" onPress={() => undefined} />);

    expect(screen.getByTestId("a-button")).toBeVisible();
  });

  it("renders its label", () => {
    render(<Button testID="a-button" label="Get started" onPress={() => undefined} />);

    expect(screen.getByText("Get started")).toBeVisible();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<Button testID="a-button" label="Get started" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button testID="a-button" label="Get started" onPress={onPress} disabled />);

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("applies the primary variant's filled background by default", () => {
    render(<Button testID="a-button" label="Get started" onPress={() => undefined} />);

    expect(screen.getByTestId("a-button")).toHaveStyle({ backgroundColor: "#08090A" });
  });

  it("applies the secondary variant with no background fill", () => {
    render(
      <Button
        testID="a-button"
        label="See a sample plan"
        onPress={() => undefined}
        variant="secondary"
      />,
    );

    expect(screen.getByTestId("a-button")).toHaveStyle({ backgroundColor: "transparent" });
  });

  it("has an accessibility role of button", () => {
    render(<Button testID="a-button" label="Get started" onPress={() => undefined} />);

    expect(screen.getByRole("button")).toBeVisible();
  });

  it("stretches to the full width of its container", () => {
    render(<Button testID="a-button" label="Get started" onPress={() => undefined} />);

    expect(screen.getByTestId("a-button")).toHaveStyle({ alignSelf: "stretch" });
  });
});
