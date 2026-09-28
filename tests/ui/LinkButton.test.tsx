import { render, screen, fireEvent } from "@tests/helpers/render";

import { LinkButton } from "@/ui/LinkButton";

describe("LinkButton", () => {
  it("forwards testID to the outermost pressable", () => {
    render(<LinkButton testID="a-link-button" label="Luke 24:25-49" onPress={() => undefined} />);

    expect(screen.getByTestId("a-link-button")).toBeVisible();
  });

  it("shows its label", () => {
    render(<LinkButton testID="a-link-button" label="Luke 24:25-49" onPress={() => undefined} />);

    expect(screen.getByText("Luke 24:25-49")).toBeVisible();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<LinkButton testID="a-link-button" label="Luke 24:25-49" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-link-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports itself with the link role", () => {
    render(<LinkButton testID="a-link-button" label="Luke 24:25-49" onPress={() => undefined} />);

    expect(screen.getByRole("link")).toBeVisible();
  });

  it("forwards its accessibility hint once given one", () => {
    render(
      <LinkButton
        testID="a-link-button"
        label="Luke 24:25-49"
        onPress={() => undefined}
        accessibilityHint="Opens Luke 24:25-49 in Bible Gateway"
      />,
    );

    expect(screen.getByTestId("a-link-button")).toHaveProp(
      "accessibilityHint",
      "Opens Luke 24:25-49 in Bible Gateway",
    );
  });
});
