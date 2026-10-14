import { fireEvent, render, screen } from "@tests/helpers/render";

import { ListSearchHeader } from "@/ui/organisms/ListSearchHeader";

function renderHeader(props: { searchable: boolean; searching?: boolean }) {
  const onSearch = jest.fn();
  const onClose = jest.fn();
  render(
    <ListSearchHeader
      testID="things"
      title="All things"
      searchLabel="Search your things"
      searching={false}
      onSearch={onSearch}
      onClose={onClose}
      {...props}
    />,
  );
  return { onSearch, onClose };
}

describe("ListSearchHeader", () => {
  it("shows the list's title", () => {
    renderHeader({ searchable: false });

    expect(screen.getByText("All things")).toBeVisible();
  });

  it("offers only its close while the list hasn't earned search", () => {
    const { onClose } = renderHeader({ searchable: false });

    fireEvent.press(screen.getByTestId("things-close-button"));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByTestId("things-search-button")).toBeNull();
  });

  it("puts search beside its close, in one pill, once the list has earned it", () => {
    const { onSearch } = renderHeader({ searchable: true });

    fireEvent.press(screen.getByTestId("things-search-button"));

    expect(onSearch).toHaveBeenCalled();
    expect(screen.getByTestId("things-header-buttons")).toContainElement(
      screen.getByTestId("things-close-button"),
    );
    expect(screen.getByLabelText("Search your things")).toBeTruthy();
  });

  it("sinks the pill into the page while the search is open", () => {
    renderHeader({ searchable: true, searching: true });

    expect(
      screen.getByTestId("things-header-buttons-shell", { includeHiddenElements: true }),
    ).toHaveProp("pointerEvents", "none");
  });
});
