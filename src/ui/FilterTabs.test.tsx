import { render, screen, fireEvent } from "@test/render";

import { FilterTabs } from "./FilterTabs";

const OPTIONS = [
  { label: "All", count: 2 },
  { label: "In progress", count: 1 },
  { label: "Done", count: 1 },
  { label: "Saved", count: 0 },
] as const;

describe("FilterTabs", () => {
  it("forwards testID to the outermost view", () => {
    render(
      <FilterTabs
        testID="a-filter-tabs"
        options={OPTIONS}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-filter-tabs")).toBeVisible();
  });

  it("renders every option's label", () => {
    render(
      <FilterTabs
        testID="a-filter-tabs"
        options={OPTIONS}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("All")).toBeVisible();
    expect(screen.getByText("In progress")).toBeVisible();
    expect(screen.getByText("Done")).toBeVisible();
    expect(screen.getByText("Saved")).toBeVisible();
  });

  it("renders each option's count", () => {
    render(
      <FilterTabs
        testID="a-filter-tabs"
        options={OPTIONS}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
  });

  it("calls onSelect with the pressed option's label", () => {
    const onSelect = jest.fn();
    render(
      <FilterTabs testID="a-filter-tabs" options={OPTIONS} selected="All" onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByTestId("a-filter-tabs-option-Done"));

    expect(onSelect).toHaveBeenCalledWith("Done");
  });

  it("colours the selected label differently from an unselected one", () => {
    render(
      <FilterTabs
        testID="a-filter-tabs"
        options={OPTIONS}
        selected="Done"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("Done")).toHaveStyle({ color: "#111113" });
    expect(screen.getByText("All")).toHaveStyle({ color: "#8A8A92" });
  });

  it("has no background on any segment", () => {
    render(
      <FilterTabs
        testID="a-filter-tabs"
        options={OPTIONS}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-filter-tabs-option-All")).toHaveStyle({
      backgroundColor: "transparent",
    });
  });
});
