import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@tests/helpers/render";

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
      contentStyle={{ gap: 16 }}
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
    ).toMatchObject({ paddingHorizontal: PAGE_INSET, gap: 16 });
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
});
