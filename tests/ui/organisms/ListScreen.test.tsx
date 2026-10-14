import { StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { fireEvent, render, screen, within } from "@tests/helpers/render";

import { SFProBody } from "@/ui/typography/SFProBody";
import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { PAGE_INSET } from "@/ui/organisms/Screen";

const ITEMS = [{ id: "a" }, { id: "b" }];

function renderList(data: readonly { id: string }[] = ITEMS) {
  return render(
    <ListScreen
      testID="a-list-page"
      header={<SFProBody>The header</SFProBody>}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SFProBody>{`Item ${item.id}`}</SFProBody>}
      empty={<SFProBody>Nothing yet</SFProBody>}
      gap={16}
    />,
  );
}

function renderPinned(data: readonly { id: string }[] = ITEMS) {
  return render(
    <ListScreen
      testID="a-list-page"
      pinned={{ bar: <SFProBody>The bar</SFProBody> }}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SFProBody>{`Item ${item.id}`}</SFProBody>}
      empty={<SFProBody>Nothing yet</SFProBody>}
      gap={16}
    />,
  );
}

describe("ListScreen", () => {
  it("shows its header and every item", () => {
    renderList();

    expect(screen.getByText("The header")).toBeVisible();
    expect(screen.getByText("Item a")).toBeVisible();
    expect(screen.getByText("Item b")).toBeVisible();
  });

  it("shows its empty state when there's nothing to list", () => {
    renderList([]);

    expect(screen.getByText("Nothing yet")).toBeVisible();
  });

  it("runs the list the screen's full width, with the page inset on its content", () => {
    renderList();

    expect(screen.getByTestId("a-list-page-list")).not.toHaveStyle({
      paddingHorizontal: PAGE_INSET,
    });
    expect(
      StyleSheet.flatten(screen.getByTestId("a-list-page-list").props.contentContainerStyle),
    ).toMatchObject({ paddingHorizontal: PAGE_INSET });
  });

  it("draws its rows on FlashList, which reuses them as they scroll", () => {
    renderList();

    expect(screen.UNSAFE_getByType(FlashList)).toBeTruthy();
  });

  it("reuses a row only for one of its kind, when its rows are of more than one", () => {
    render(
      <ListScreen
        testID="a-list-page"
        data={ITEMS}
        keyExtractor={(item) => item.id}
        itemType={(item) => (item.id === "a" ? "label" : "card")}
        renderItem={({ item }) => <SFProBody>{`Item ${item.id}`}</SFProBody>}
      />,
    );

    const getItemType = screen.UNSAFE_getByType(FlashList).props.getItemType as (
      item: { id: string },
      index: number,
    ) => string;
    expect(ITEMS.map((item, index) => getItemType(item, index))).toEqual(["label", "card"]);
  });

  it("sets its rows `gap` apart, and its first and last as far from its ends", () => {
    renderList();

    // Before the first row, between the two, and after the last.
    const gaps = screen.getAllByTestId("a-list-page-list-gap");
    expect(gaps).toHaveLength(3);
    for (const gap of gaps) expect(gap).toHaveStyle({ height: 16 });
  });

  it("puts the page inset on its header", () => {
    renderList();

    expect(screen.getByTestId("a-list-page-header")).toHaveStyle({ paddingHorizontal: PAGE_INSET });
  });

  it("starts its first item clear of the floating header and its fade", () => {
    renderList();
    fireEvent(screen.getByTestId("a-list-page-header"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 100 } },
    });

    expect(screen.getByTestId("a-list-page-list-top-clearance")).toHaveStyle({
      height: 100 + EDGE_FADE,
    });
  });

  it("ends its last item clear of the bottom edge's fade", () => {
    renderList();

    expect(screen.getByTestId("a-list-page-list-bottom-clearance")).toHaveStyle({
      height: EDGE_FADE,
    });
  });

  describe("pinned", () => {
    it("draws its rows on FlashList too", () => {
      renderPinned();

      expect(screen.UNSAFE_getByType(FlashList)).toBeTruthy();
      expect(screen.getByText("Item b")).toBeVisible();
    });

    it("holds its bar above the list, out of what scrolls", () => {
      renderPinned();

      expect(screen.getByTestId("a-list-page-list-pinned-bar")).toHaveTextContent("The bar");
      expect(
        within(screen.getByTestId("a-list-page-list")).queryByTestId("a-list-page-list-pinned-bar"),
      ).toBeNull();
    });

    it("starts its first row `gap` below the bar", () => {
      renderPinned();

      expect(screen.getAllByTestId("a-list-page-list-gap")[0]).toHaveStyle({ height: 16 });
    });

    it("says how far it's scrolled, for a bar that changes with it (Plans' title)", () => {
      const onScroll = jest.fn();
      render(
        <ListScreen
          testID="a-list-page"
          pinned={{ bar: <SFProBody>The bar</SFProBody> }}
          data={ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SFProBody>{`Item ${item.id}`}</SFProBody>}
          onScroll={onScroll}
        />,
      );

      fireEvent.scroll(screen.getByTestId("a-list-page-list"), {
        nativeEvent: { contentOffset: { x: 0, y: 40 } },
      });

      expect(onScroll).toHaveBeenCalledWith(40);
    });

    it("shows its empty state under the bar when there's nothing to list", () => {
      renderPinned([]);

      expect(screen.getByText("Nothing yet")).toBeVisible();
    });
  });
});
