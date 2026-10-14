import { Image } from "expo-image";
import { render, screen } from "@tests/helpers/render";

import { PlanArtFill } from "@/features/progress/components/PlanArtFill";

const ART = "https://images.example.com/sermon.jpg";

describe("PlanArtFill", () => {
  it("keys its image to the artwork, so a reused row never shows the last row's", () => {
    render(<PlanArtFill art={{ source: ART, colors: [] }} />);

    expect(screen.UNSAFE_getByType(Image).props.recyclingKey).toBe(ART);
  });
});
