import { Stop } from "react-native-svg";
import { render, screen } from "@tests/helpers/render";

import { BottomFade } from "@/ui/atoms/BottomFade";

function stopOpacities() {
  return screen.UNSAFE_getAllByType(Stop).map((stop) => stop.props.stopOpacity as unknown);
}

describe("BottomFade", () => {
  it("is as tall as asked", () => {
    render(<BottomFade testID="a-fade" height={60} />);

    expect(screen.getByTestId("a-fade")).toHaveStyle({ height: 60 });
  });

  it("never takes touches", () => {
    render(<BottomFade testID="a-fade" height={60} />);

    expect(screen.getByTestId("a-fade")).toHaveProp("pointerEvents", "none");
  });

  it("is fully opaque at its solid end, as it always was", () => {
    render(<BottomFade testID="a-fade" height={60} />);

    expect(stopOpacities()).toEqual([0, 1, 1]);
  });

  it("stops short of opaque at a lighter peak", () => {
    render(<BottomFade testID="a-fade" height={60} peak={0.85} />);

    expect(stopOpacities()).toEqual([0, 0.85, 0.85]);
  });
});
