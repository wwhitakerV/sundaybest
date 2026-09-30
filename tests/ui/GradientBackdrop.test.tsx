import { render, screen, fireEvent } from "@tests/helpers/render";

import { GradientBackdrop } from "@/ui/GradientBackdrop";

const STOPS = [
  { offset: 0, color: "#1F5A6E" },
  { offset: 1, color: "#3D403F" },
];

describe("GradientBackdrop", () => {
  it("fills whatever it's placed in", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} />);

    expect(screen.getByTestId("a-backdrop")).toHaveStyle({
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it("fills its box, however that box's size changes — never redrawing as it animates", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} />);

    fireEvent(screen.getByTestId("a-backdrop"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 170, height: 250 } },
    });

    expect(screen.getByTestId("a-backdrop-drawing")).toHaveProp("width", "100%");
    expect(screen.getByTestId("a-backdrop-drawing")).toHaveProp("height", "100%");
  });

  it("never takes touches", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} />);

    expect(screen.getByTestId("a-backdrop")).toHaveProp("pointerEvents", "none");
  });

  it("fills all of it by default", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} />);

    expect(screen.getByTestId("a-backdrop-fill").props.mask).toBeUndefined();
  });

  it("can show only from a line down, fading in above it", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} reveal={{ from: 240, to: 280 }} />);

    expect(screen.getByTestId("a-backdrop-fill").props.mask).toMatch(/^gradient-backdrop-mask-/);
  });

  it("reveals down from its line by default", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} reveal={{ from: 240, to: 280 }} />);

    const fade = screen.UNSAFE_getByProps({ gradientUnits: "userSpaceOnUse" });
    expect(fade.props).toMatchObject({ x1: "0", y1: 240, x2: "0", y2: 280 });
  });

  it("can reveal across instead: clear at one line, solid by the other", () => {
    render(
      <GradientBackdrop
        testID="a-backdrop"
        stops={STOPS}
        reveal={{ from: 260, to: 170, axis: "x" }}
      />,
    );

    const fade = screen.UNSAFE_getByProps({ gradientUnits: "userSpaceOnUse" });
    expect(fade.props).toMatchObject({ x1: 260, y1: "0", x2: 170, y2: "0" });
  });

  it("has no image over it unless given one", () => {
    render(<GradientBackdrop testID="a-backdrop" stops={STOPS} />);

    expect(screen.queryByTestId("a-backdrop-underlay")).toBeNull();
  });

  it("can wash an image over the gradient, faintly", () => {
    render(
      <GradientBackdrop
        testID="a-backdrop"
        stops={STOPS}
        underlay={{ uri: "https://example.com/still.jpg", opacity: 0.2 }}
      />,
    );

    expect(screen.getByTestId("a-backdrop-underlay").props.opacity).toBe(0.2);
  });

  it("reveals the image from the same line as the gradient", () => {
    render(
      <GradientBackdrop
        testID="a-backdrop"
        stops={STOPS}
        reveal={{ from: 240, to: 280 }}
        underlay={{ uri: "https://example.com/still.jpg", opacity: 0.2 }}
      />,
    );

    expect(screen.getByTestId("a-backdrop-underlay").props.mask).toBe(
      screen.getByTestId("a-backdrop-fill").props.mask,
    );
  });
});
