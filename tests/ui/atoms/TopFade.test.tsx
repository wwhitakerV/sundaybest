import { render, screen } from "@tests/helpers/render";

import { TopFade } from "@/ui/atoms/TopFade";

describe("TopFade", () => {
  it("hangs from the top of its container, as tall as asked", () => {
    render(<TopFade testID="a-fade" height={80} solidHeight={60} />);

    expect(screen.getByTestId("a-fade")).toHaveStyle({ position: "absolute", top: 0, height: 80 });
  });

  it("never takes touches", () => {
    render(<TopFade testID="a-fade" height={80} solidHeight={60} />);

    expect(screen.getByTestId("a-fade")).toHaveProp("pointerEvents", "none");
  });
});
