import { render, screen, fireEvent } from "@tests/helpers/render";

import { PlanNav, type PlanNavProps } from "@/features/plans/components/PlanNav";

function renderNav(props: Partial<PlanNavProps> = {}) {
  return render(
    <PlanNav
      testIDs={{ root: "nav", header: "nav-header", back: "nav-back", more: "nav-more" }}
      shown
      top={0}
      style={{}}
      onBack={() => undefined}
      onMore={() => undefined}
      {...props}
    />,
  );
}

describe("PlanNav", () => {
  it("opens the More menu when More is pressed", () => {
    const onMore = jest.fn();
    renderNav({ onMore });

    fireEvent.press(screen.getByTestId("nav-more"));

    expect(onMore).toHaveBeenCalledTimes(1);
  });

  it("goes back when Back is pressed", () => {
    const onBack = jest.fn();
    renderNav({ onBack });

    fireEvent.press(screen.getByTestId("nav-back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("takes no touches while it isn't the look showing", () => {
    const onMore = jest.fn();
    renderNav({ onMore, shown: false });

    fireEvent.press(screen.getByTestId("nav-more", { includeHiddenElements: true }));

    expect(onMore).not.toHaveBeenCalled();
  });
});
