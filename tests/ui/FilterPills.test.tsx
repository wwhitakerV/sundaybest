import { render, screen, fireEvent } from "@tests/helpers/render";

import { FilterPills, type FilterPillsProps } from "@/ui/FilterPills";

const OPTIONS = [
  { label: "All", count: 4 },
  { label: "In progress", count: 1 },
  { label: "Done", count: 1 },
  { label: "Saved", count: 2 },
] as const;

function renderPills(props: Partial<FilterPillsProps<(typeof OPTIONS)[number]>> = {}) {
  return render(
    <FilterPills
      testID="a-filter-pills"
      options={OPTIONS}
      selected="All"
      onSelect={() => undefined}
      {...props}
    />,
  );
}

describe("FilterPills", () => {
  it("forwards testID to the outermost view", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills")).toBeVisible();
  });

  it("shows each option's label with its count", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills-option-All")).toHaveTextContent("All4");
    expect(screen.getByTestId("a-filter-pills-option-In progress")).toHaveTextContent(
      "In progress1",
    );
    expect(screen.getByTestId("a-filter-pills-option-Saved")).toHaveTextContent("Saved2");
  });

  it("calls onSelect with the pressed option's label", () => {
    const onSelect = jest.fn();
    renderPills({ onSelect });

    fireEvent.press(screen.getByTestId("a-filter-pills-option-Done"));

    expect(onSelect).toHaveBeenCalledWith("Done");
  });

  it("marks only the selected option as selected", () => {
    renderPills({ selected: "Done" });

    expect(screen.getByTestId("a-filter-pills-option-Done")).toBeSelected();
    expect(screen.getByTestId("a-filter-pills-option-All")).not.toBeSelected();
  });

  it("fills the selected pill in the brand red, its words in white", () => {
    renderPills({ selected: "Done" });

    expect(screen.getByTestId("a-filter-pills-option-Done")).toHaveStyle({
      backgroundColor: "#D62626",
    });
    expect(screen.getByText("Done")).toHaveStyle({ color: "#FFFFFF" });
  });

  it("fills every other pill in the off-white, its words quieter", () => {
    renderPills({ selected: "Done" });

    expect(screen.getByTestId("a-filter-pills-option-All")).toHaveStyle({
      backgroundColor: "#F7F1F1",
    });
    expect(screen.getByText("All")).toHaveStyle({ color: "#55555D" });
  });

  it("rounds each option fully, as a pill", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills-option-All")).toHaveStyle({ borderRadius: 999 });
  });

  it("reaches past its container by its bleed, so it can scroll to the screen's edges", () => {
    renderPills({ bleed: 24 });

    expect(screen.getByTestId("a-filter-pills")).toHaveStyle({ marginHorizontal: -24 });
  });

  it("never gives up its pills' height to a list below it", () => {
    render(
      <FilterPills
        testID="a-row"
        options={[{ label: "All", count: 3 }]}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-row")).toHaveStyle({ flexGrow: 0, flexShrink: 0 });
  });
});
