import { Image } from "expo-image";
import { render, screen } from "@tests/helpers/render";

import { WeekArtStack } from "@/features/progress/components/WeekArtStack";

const FIRST = "https://images.example.com/first.jpg";
const SECOND = "https://images.example.com/second.jpg";

describe("WeekArtStack", () => {
  it("keys each image to its artwork, so a reused row never shows the last row's", () => {
    render(
      <WeekArtStack
        art={[
          { source: FIRST, colors: [] },
          { source: SECOND, colors: [] },
        ]}
      />,
    );

    expect(
      screen.UNSAFE_getAllByType(Image).map((image): unknown => image.props.recyclingKey),
    ).toEqual(
      // Drawn newest on top: the last given first.
      [SECOND, FIRST],
    );
  });
});
