import { Stop } from "react-native-svg";
import { render, screen } from "@tests/helpers/render";

import { TopFade } from "@/ui/atoms/TopFade";

function stopOpacities() {
  return screen.UNSAFE_getAllByType(Stop).map((stop) => stop.props.stopOpacity as unknown);
}

describe("TopFade", () => {
  it("hangs from the top of its container, as tall as asked", () => {
    render(<TopFade testID="a-fade" height={80} solidHeight={60} />);

    expect(screen.getByTestId("a-fade")).toHaveStyle({ position: "absolute", top: 0, height: 80 });
  });

  it("never takes touches", () => {
    render(<TopFade testID="a-fade" height={80} solidHeight={60} />);

    expect(screen.getByTestId("a-fade")).toHaveProp("pointerEvents", "none");
  });

  it("scales its whole ramp by a lighter peak, so the curve keeps its shape", () => {
    render(
      <TopFade
        testID="a-fade"
        height={80}
        solidHeight={0}
        peak={0.85}
        ramp={[
          { at: 0, opacity: 1 },
          { at: 0.5, opacity: 0.6 },
          { at: 1, opacity: 0 },
        ]}
      />,
    );

    expect(stopOpacities()).toEqual([0.85, 0.85, 0.51, 0]);
  });

  it("is fully opaque at its solid end by default", () => {
    render(<TopFade testID="a-fade" height={80} solidHeight={60} />);

    expect(stopOpacities()[0]).toBe(1);
  });
});
