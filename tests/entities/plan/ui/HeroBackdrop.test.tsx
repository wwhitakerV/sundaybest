import { render, screen } from "@tests/helpers/render";
import { Stop } from "react-native-svg";

import { HeroBackdrop } from "@/entities/plan/ui/HeroBackdrop";
import { HERO_WASH_OPACITY } from "@/entities/plan/ui/hero-layout";
import { lightTheme } from "@/theme/tokens";
import { getBackdropStops } from "@/utils/color/getBackdropStops";

const COLORS = ["#48443F", "#654F46", "#111117"];

describe("HeroBackdrop", () => {
  it("forwards its testID", () => {
    render(<HeroBackdrop colors={COLORS} thumbnailUrl={null} testID="backdrop" />);

    expect(screen.getByTestId("backdrop")).toBeOnTheScreen();
  });

  it("washes the sermon's still over the gradient at the hero's wash opacity", () => {
    render(<HeroBackdrop colors={COLORS} thumbnailUrl="still.jpg" testID="backdrop" />);

    expect(screen.getByTestId("backdrop-underlay")).toHaveProp("opacity", HERO_WASH_OPACITY);
  });

  it("draws no underlay without a thumbnail", () => {
    render(<HeroBackdrop colors={COLORS} thumbnailUrl={null} testID="backdrop" />);

    expect(screen.queryByTestId("backdrop-underlay")).toBeNull();
  });

  it("draws its gradient in the sermon's colours", () => {
    render(<HeroBackdrop colors={COLORS} thumbnailUrl={null} testID="backdrop" />);

    expect(gradientColours()).toEqual(
      getBackdropStops(COLORS, lightTheme.colors.featureBackdrop).map(({ color }) => color),
    );
  });

  it("draws it in the hero's fallback colour until the sermon's are known", () => {
    render(<HeroBackdrop colors={[]} thumbnailUrl={null} testID="backdrop" />);

    expect(gradientColours()).toEqual(
      getBackdropStops([], lightTheme.colors.featureBackdrop).map(({ color }) => color),
    );
  });
});

/** The colours of the gradient's stops, in order. */
function gradientColours(): unknown[] {
  return screen.UNSAFE_getAllByType(Stop).map((stop) => stop.props.stopColor as unknown);
}
