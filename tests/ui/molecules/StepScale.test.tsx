import { render, screen, fireEvent, within } from "@tests/helpers/render";
import Svg from "react-native-svg";

import { lightTheme } from "@/theme/tokens";

import { StepScale } from "@/ui/molecules/StepScale";

type Props = Partial<React.ComponentProps<typeof StepScale>>;

function scale({ value = 0, onChange = () => undefined, ...rest }: Props = {}) {
  return (
    <StepScale
      value={value}
      min={-4}
      max={8}
      step={2}
      onChange={onChange}
      testID="a-scale"
      accessibilityLabel="Text size"
      {...rest}
    />
  );
}

describe("StepScale", () => {
  it("draws a small and a large A", () => {
    render(scale());

    expect(screen.getAllByText("A")).toHaveLength(2);
  });

  it("draws one tick per step, ends included", () => {
    render(scale());

    // (8 - -4) / 2 + 1
    expect(screen.getAllByTestId(/^a-scale-tick-\d+$/)).toHaveLength(7);
    expect(screen.getByTestId("a-scale-tick-0")).toBeVisible();
    expect(screen.getByTestId("a-scale-tick-6")).toBeVisible();
    expect(screen.queryByTestId("a-scale-tick-7")).toBeNull();
  });

  it("draws a dot for the current step", () => {
    render(scale());

    expect(screen.getAllByTestId("a-scale-dot")).toHaveLength(1);
  });

  it("increases by a step", () => {
    const onChange = jest.fn();
    render(scale({ value: 0, onChange }));

    fireEvent.press(screen.getByTestId("a-scale-increase"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("decreases by a step", () => {
    const onChange = jest.fn();
    render(scale({ value: 0, onChange }));

    fireEvent.press(screen.getByTestId("a-scale-decrease"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(-2);
  });

  it("cannot increase past its maximum", () => {
    const onChange = jest.fn();
    render(scale({ value: 8, onChange }));

    fireEvent.press(screen.getByTestId("a-scale-increase"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("a-scale-increase")).toBeDisabled();
  });

  it("cannot decrease past its minimum", () => {
    const onChange = jest.fn();
    render(scale({ value: -4, onChange }));

    fireEvent.press(screen.getByTestId("a-scale-decrease"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("a-scale-decrease")).toBeDisabled();
  });

  it("is adjustable, and says where it stands", () => {
    render(scale({ value: 2 }));

    const node = screen.getByTestId("a-scale");
    expect(node).toHaveProp("accessibilityRole", "adjustable");
    expect(node).toHaveProp("accessibilityLabel", "Text size");
    expect(node).toHaveProp("accessibilityValue", { min: -4, max: 8, now: 2 });
  });

  it("steps up and down by its accessibility actions", () => {
    const onChange = jest.fn();
    render(scale({ value: 0, onChange }));
    const node = screen.getByTestId("a-scale");

    fireEvent(node, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    fireEvent(node, "accessibilityAction", { nativeEvent: { actionName: "decrement" } });

    expect(onChange.mock.calls).toEqual([[2], [-2]]);
  });

  it("does not step past its ends by accessibility action", () => {
    const onChange = jest.fn();
    render(scale({ value: 8, onChange }));

    fireEvent(screen.getByTestId("a-scale"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reads its value as text when given a formatter", () => {
    render(scale({ value: 2, valueText: (value: number) => `size ${value}` }));

    expect(screen.getByTestId("a-scale")).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ min: -4, max: 8, now: 2, text: "size 2" }),
    );
  });

  describe("the dot", () => {
    const DOT = 16;

    it("is at its step's place as soon as the track is laid out, with no slide", () => {
      render(scale({ value: 2 }));

      fireEvent(screen.getByTestId("a-scale-track"), "layout", {
        nativeEvent: { layout: { width: 316, height: 44, x: 0, y: 0 } },
      });

      // index 3 of 7 steps: 3/6 of (316 - 16)
      expect(screen.getByTestId("a-scale-dot")).toHaveStyle({
        transform: [{ translateX: (3 / 6) * (316 - DOT) }],
      });
    });

    it("sits at the far end for the largest value", () => {
      render(scale({ value: 8 }));

      fireEvent(screen.getByTestId("a-scale-track"), "layout", {
        nativeEvent: { layout: { width: 316, height: 44, x: 0, y: 0 } },
      });

      expect(screen.getByTestId("a-scale-dot")).toHaveStyle({
        transform: [{ translateX: 300 }],
      });
    });
  });

  describe("its look", () => {
    it.each(["decrease", "increase"])("draws the %s icon at a 3pt stroke", (which) => {
      render(scale());

      const svg = within(screen.getByTestId(`a-scale-${which}`)).UNSAFE_getByType(Svg);

      expect(svg.props.strokeWidth).toBe(3);
    });

    it("draws its line in the progress track colour", () => {
      render(scale());

      expect(screen.getByTestId("a-scale-line")).toHaveStyle({
        backgroundColor: lightTheme.colors.progressTrack,
      });
    });

    it("draws each tick in the progress track colour", () => {
      render(scale());

      expect(screen.getByTestId("a-scale-tick-0")).toHaveStyle({
        backgroundColor: lightTheme.colors.progressTrack,
      });
    });
  });
});
