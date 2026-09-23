import { render, screen } from "@tests/helpers/render";

import { BottomFade } from "@/ui/BottomFade";

describe("BottomFade", () => {
  it("is as tall as asked", () => {
    render(<BottomFade testID="a-fade" height={60} />);

    expect(screen.getByTestId("a-fade")).toHaveStyle({ height: 60 });
  });

  it("never takes touches", () => {
    render(<BottomFade testID="a-fade" height={60} />);

    expect(screen.getByTestId("a-fade")).toHaveProp("pointerEvents", "none");
  });
});
