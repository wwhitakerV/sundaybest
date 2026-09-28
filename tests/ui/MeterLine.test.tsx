import { render, screen } from "@tests/helpers/render";

import { MeterLine } from "@/ui/MeterLine";

describe("MeterLine", () => {
  it("forwards testID to the outermost element", () => {
    render(<MeterLine testID="a-meter-line" value={5} total={15} accessibilityLabel="5 of 15" />);

    expect(screen.getByTestId("a-meter-line")).toBeVisible();
  });

  it("reports itself as a progress bar", () => {
    render(<MeterLine testID="a-meter-line" value={5} total={15} accessibilityLabel="5 of 15" />);

    expect(screen.getByRole("progressbar")).toBeVisible();
  });

  it("exposes its value against its total", () => {
    render(<MeterLine testID="a-meter-line" value={5} total={15} accessibilityLabel="5 of 15" />);

    expect(screen.getByTestId("a-meter-line")).toHaveProp("accessibilityValue", {
      min: 0,
      max: 15,
      now: 5,
    });
  });

  it("clamps a value below zero to zero", () => {
    render(<MeterLine testID="a-meter-line" value={-3} total={15} accessibilityLabel="0 of 15" />);

    expect(screen.getByTestId("a-meter-line")).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 0 }),
    );
  });

  it("clamps a value above its total to the total", () => {
    render(<MeterLine testID="a-meter-line" value={99} total={15} accessibilityLabel="15 of 15" />);

    expect(screen.getByTestId("a-meter-line")).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 15 }),
    );
  });

  it("forwards its accessibility label", () => {
    render(
      <MeterLine
        testID="a-meter-line"
        value={5}
        total={15}
        accessibilityLabel="5 of 15 answered"
      />,
    );

    expect(screen.getByTestId("a-meter-line")).toHaveProp("accessibilityLabel", "5 of 15 answered");
  });
});
