import { render, screen } from "@tests/helpers/render";

import { SermonSearchResults } from "@/features/plan-creation/components/SermonSearchResults";

describe("SermonSearchResults", () => {
  it.each(["", "   "])("shows nothing for the blank query %j", (query) => {
    render(
      <SermonSearchResults
        testID="results"
        query={query}
        results={[]}
        status="idle"
        selectedId={null}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("results-hint")).toBeNull();
    expect(screen.queryByText("Search by pastor, church, topic, or sermon title.")).toBeNull();
  });

  it("says so when nothing matches", () => {
    render(
      <SermonSearchResults
        testID="results"
        query="zzz"
        results={[]}
        status="ready"
        selectedId={null}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId("results-empty")).toBeVisible();
  });
});
