import { render, screen } from "@tests/helpers/render";

import { HeroContentFade } from "@/ui/hero/HeroContentFade";

const STOPS = [
  { offset: 0, color: "#1F5A6E" },
  { offset: 1, color: "#3D403F" },
];

describe("HeroContentFade", () => {
  it("draws nothing until the hero's measured", () => {
    render(
      <HeroContentFade
        testID="a-fade"
        stops={STOPS}
        artworkBottom={291}
        artworkHeight={159}
        heroHeight={0}
      />,
    );

    expect(screen.queryByTestId("a-fade")).toBeNull();
  });

  it("then lays the hero's colour behind the words, coming in from over the artwork", () => {
    render(
      <HeroContentFade
        testID="a-fade"
        stops={STOPS}
        artworkBottom={291}
        artworkHeight={159}
        heroHeight={700}
      />,
    );

    expect(screen.getByTestId("a-fade-fill").props.mask).toBeTruthy();
  });

  it("covers the whole hero, wherever the hero puts it", () => {
    render(
      <HeroContentFade
        testID="a-fade"
        stops={STOPS}
        artworkBottom={291}
        artworkHeight={159}
        heroHeight={700}
        style={{ top: -52 }}
      />,
    );

    expect(screen.getByTestId("a-fade-layer")).toHaveStyle({ position: "absolute", top: -52 });
  });
});
