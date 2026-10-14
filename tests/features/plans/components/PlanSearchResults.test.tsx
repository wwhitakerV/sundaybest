import { FlatList } from "react-native";
import { fireEvent, render, screen } from "@tests/helpers/render";

import { buildList } from "@tests/factories/build";
import { PlanSearchResults } from "@/features/plans/components/PlanSearchResults";
import { PlanSearchRow } from "@/features/plans/components/PlanSearchRow";

type Rows = Parameters<typeof PlanSearchResults>[0]["rows"];

const rowsOf = (count: number): Rows =>
  buildList(count, (index) => ({
    id: `plan-${index}`,
    title: `Plan ${index}`,
    parts: [{ text: `Plan ${index}`, match: false }],
    detail: [{ text: "Day 1 of 7", match: false }],
    thumbnailUrl: null,
  }));

function renderResults(props: Partial<Parameters<typeof PlanSearchResults>[0]> = {}) {
  const handlers = { onOpen: jest.fn(), onRetry: jest.fn() };
  render(
    <PlanSearchResults
      status="ready"
      rows={rowsOf(2)}
      noMatch="Nothing matches “grace”."
      foot={80}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("PlanSearchResults", () => {
  it("says what to search before anything's typed", () => {
    renderResults({ status: "idle", rows: [] });

    expect(screen.getByText("Search your plans")).toBeVisible();
  });

  it("says nothing matches when nothing does", () => {
    renderResults({ status: "empty", rows: [] });

    expect(screen.getByText("Nothing matches “grace”.")).toBeVisible();
  });

  it("offers another try when the search couldn't be made", () => {
    const { onRetry } = renderResults({ status: "error", rows: [] });

    fireEvent.press(screen.getByTestId("plan-search-retry"));

    expect(onRetry).toHaveBeenCalled();
  });

  it("lists the plans found on a list that draws only the rows near view", () => {
    renderResults();

    expect(screen.UNSAFE_getByType(FlatList)).toBeTruthy();
    expect(screen.getByText("Plan 1")).toBeVisible();
  });

  it("opens the plan of the row tapped", () => {
    const { onOpen } = renderResults();

    fireEvent.press(screen.getByTestId("plan-search-result-plan-1"));

    expect(onOpen).toHaveBeenCalledWith("plan-1");
  });

  it("glides each row to its new place as the results reorder", () => {
    renderResults();

    expect(screen.UNSAFE_getByType(FlatList).props.itemLayoutAnimation).toBeDefined();
  });

  it("ends the last row clear of the field and keyboard", () => {
    renderResults({ foot: 120 });

    expect(screen.getByTestId("plan-search-results")).toHaveProp(
      "contentContainerStyle",
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 120 })]),
    );
  });

  it("fades in a row found later only in the first screenful", async () => {
    renderResults({ rows: rowsOf(30) });

    // Scrolled down, rows further on are drawn: they weren't in sight as the results came.
    const list = screen.getByTestId("plan-search-results");
    fireEvent(list, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 900 } } });
    fireEvent(list, "contentSizeChange", 400, 3000);
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 2000 },
        contentSize: { width: 400, height: 3000 },
        layoutMeasurement: { width: 400, height: 900 },
      },
    });
    await screen.findByTestId("plan-search-result-plan-20");

    const fades = (id: string) =>
      screen
        .UNSAFE_getAllByType(PlanSearchRow)
        .find((row) => row.props.testID === `plan-search-result-${id}`)?.props.fades as unknown;
    expect(fades("plan-0")).toBe(true);
    expect(fades("plan-20")).toBe(false);
  });
});
