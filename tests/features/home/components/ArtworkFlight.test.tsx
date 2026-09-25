import { render, screen } from "@tests/helpers/render";

import { ArtworkFlight } from "@/features/home/components/ArtworkFlight";

describe("ArtworkFlight", () => {
  it("carries the artwork, and never takes taps", () => {
    render(<ArtworkFlight thumbnailUrl={null} />);

    expect(screen.getByTestId("home-tab-artwork-flight")).toHaveProp("pointerEvents", "none");
  });

  it("floats over the screen, placed by its style", () => {
    render(<ArtworkFlight thumbnailUrl={null} />);

    expect(screen.getByTestId("home-tab-artwork-flight")).toHaveStyle({ position: "absolute" });
  });
});
