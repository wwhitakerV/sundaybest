import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { StageLift, type StageLiftProps } from "@/features/welcome/components/lift/StageLift";
import type { LiftLayout } from "@/features/welcome/logic/lift";

const ANCHOR = { x: 0, y: 0, width: 200, height: 80 };
const LAYOUT: LiftLayout = {
  onPhone: { x: 10, y: 400, scale: 0.6 },
  onPhoneOpacity: 1,
  lifted: { x: 20, y: 300, scale: 1 },
};

function Piece() {
  return <Text>A piece</Text>;
}

function renderLift(backing: StageLiftProps["backing"]) {
  return render(
    <StageLift
      Piece={Piece}
      elapsedMs={0}
      anchor={ANCHOR}
      layout={LAYOUT}
      backing={backing}
      lifted
    />,
  );
}

describe("StageLift", () => {
  it("rings the piece with a see-through rim, so what's behind shows through it the whole time", () => {
    renderLift({ rim: 6, inset: 0, radius: 24 });

    expect(screen.getByTestId("stage-lift-card")).toHaveStyle({
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      top: -6,
      borderRadius: 30,
    });
  });

  it("keeps a solid container inside the rim, so no piece is ever see-through", () => {
    renderLift({ rim: 6, inset: 0, radius: 24 });

    expect(screen.getByTestId("stage-lift-fill")).toHaveStyle({
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
    });
  });

  it("gives a piece with no surface of its own room inside that container", () => {
    renderLift({ rim: 6, inset: 14, radius: 32 });

    expect(screen.getByTestId("stage-lift-card")).toHaveStyle({ top: -20, borderRadius: 38 });
  });
});
