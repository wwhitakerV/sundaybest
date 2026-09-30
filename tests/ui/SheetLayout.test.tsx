import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { HALF_SHEET_OPTIONS, SheetLayout } from "@/ui/SheetLayout";

function renderSheet() {
  render(
    <SheetLayout testID="a-sheet" title="Topics covered">
      <Text>How Jesus reads the Scriptures</Text>
    </SheetLayout>,
  );
}

describe("SheetLayout", () => {
  it("heads what it holds with its title", () => {
    renderSheet();

    expect(screen.getByRole("header")).toHaveTextContent("Topics covered");
    expect(screen.getByText("How Jesus reads the Scriptures")).toBeVisible();
  });

  it("is one scrolling list, its title pinned at the top — nothing beside it for the sheet to lay over", () => {
    renderSheet();

    const sheet = screen.getByTestId("a-sheet");
    expect(sheet).toHaveProp("stickyHeaderIndices", [0]);
    expect(sheet).toHaveProp("contentInsetAdjustmentBehavior", "never");
  });

  it("pins its title on the page's background, so what scrolls under it is hidden", () => {
    renderSheet();

    expect(screen.getByTestId("a-sheet-header")).toHaveStyle({
      backgroundColor: lightTheme.colors.background,
    });
  });
});

describe("HALF_SHEET_OPTIONS", () => {
  it("presents a native form sheet, half the screen tall, with its grabber", () => {
    expect(HALF_SHEET_OPTIONS).toMatchObject({
      presentation: "formSheet",
      sheetAllowedDetents: [0.5],
      sheetGrabberVisible: true,
    });
  });

  it("is the page's white from its first frame, so iOS draws the grabber dark from the start", () => {
    expect(HALF_SHEET_OPTIONS.contentStyle).toEqual({
      backgroundColor: lightTheme.colors.background,
    });
  });
});
