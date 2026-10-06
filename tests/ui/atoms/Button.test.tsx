import { Text } from "react-native";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import type { LucideIcon } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";

import { Button } from "@/ui/atoms/Button";

/** Stands in for an icon: draws a mark and forwards the testID it is handed. */
const Marker = (({ testID }: { testID?: string }) => (
  <Text testID={testID}>→</Text>
)) as unknown as LucideIcon;

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

  it("draws its icon before the label, inside the button", () => {
    render(<Button testID="a-button" label="Share" icon={Marker} onPress={() => undefined} />);

    expect(within(screen.getByTestId("a-button")).getByTestId("a-button-icon")).toBeVisible();
    expect(screen.getByTestId("a-button")).toHaveTextContent("→Share");
  });

  it("draws no icon when it has none", () => {
    render(<Button testID="a-button" label="Share" onPress={() => undefined} />);

    expect(screen.queryByTestId("a-button-icon")).toBeNull();
  });

  it("applies the soft variant: a pill filled with the segment colour and a 1pt container border", () => {
    render(<Button testID="a-button" label="Share" variant="soft" onPress={() => undefined} />);

    expect(screen.getByTestId("a-button")).toHaveStyle({
      backgroundColor: lightTheme.colors.segmentBackground,
      borderWidth: 1,
      borderColor: lightTheme.colors.containerBorder,
    });
  });

  it("sets the soft variant's label in the text colour", () => {
    render(<Button testID="a-button" label="Share" variant="soft" onPress={() => undefined} />);

    expect(screen.getByText("Share")).toHaveStyle({ color: lightTheme.colors.text });
  });
});

describe("Button loading", () => {
  function loadingButton(onPress = () => undefined) {
    return render(<Button testID="a-button" label="Get started" loading onPress={onPress} />);
  }

  it("never spins while loading", () => {
    loadingButton();

    expect(screen.queryByTestId("a-button-spinner")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("keeps its words while loading", () => {
    loadingButton();

    expect(screen.getByText("Get started")).toBeVisible();
  });

  it("is still named by its label while loading", () => {
    loadingButton();

    expect(screen.getByTestId("a-button")).toHaveProp("accessibilityLabel", "Get started");
  });

  it("reports itself disabled and busy while loading", () => {
    loadingButton();

    expect(screen.getByTestId("a-button")).toHaveProp(
      "accessibilityState",
      expect.objectContaining({ disabled: true, busy: true }),
    );
  });

  it("does not call onPress while loading", () => {
    const onPress = jest.fn();
    loadingButton(onPress);

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows no spinner and its label when not loading", () => {
    render(<Button testID="a-button" label="Get started" onPress={() => undefined} />);

    expect(screen.queryByTestId("a-button-spinner")).toBeNull();
    expect(screen.getByText("Get started")).toBeVisible();
  });
});
