import Svg from "react-native-svg";
import { render, screen, within } from "@tests/helpers/render";

import { PlanRow } from "@/features/home/components/PlanRow";
import { lightTheme } from "@/theme/tokens";

describe("PlanRow", () => {
  it("is a content card with a card's edge, as Plans' cards are", () => {
    render(
      <PlanRow
        testID="row"
        title="Still Praying"
        detail="Sample plan, 3 days"
        done={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId("row")).toHaveStyle({
      borderRadius: 28,
      borderColor: lightTheme.colors.containerBorder,
    });
  });

  it("ends in a row's chevron, 18", () => {
    render(
      <PlanRow
        testID="row"
        title="Still Praying"
        detail="Sample plan, 3 days"
        done={false}
        onPress={jest.fn()}
      />,
    );

    expect(within(screen.getByTestId("row")).UNSAFE_getAllByType(Svg).at(-1)?.props.width).toBe(18);
  });
});
