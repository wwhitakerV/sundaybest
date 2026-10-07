import { fireEvent, render, screen } from "@tests/helpers/render";

import { PlanMoreMenu } from "@/features/plans/components/PlanMoreMenu";
import { getMoreMenuItems } from "@/features/plans/logic/more-menu";

describe("PlanMoreMenu", () => {
  it("offers Reset plan, and does what it's given when pressed", () => {
    const reset = jest.fn();
    render(
      <PlanMoreMenu
        open
        onClose={jest.fn()}
        saved={false}
        anchor={{ top: 0, right: 0 }}
        items={getMoreMenuItems(false).map((item) => ({
          ...item,
          select: item.key === "reset" ? reset : jest.fn(),
        }))}
      />,
    );

    fireEvent.press(screen.getByText("Reset plan"));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
