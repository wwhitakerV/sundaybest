import { StyleSheet } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { SFProBody } from "@/ui/typography/SFProBody";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";

function renderPage() {
  return render(
    <ScrollScreen
      testID="a-page"
      header={<SFProBody>The header</SFProBody>}
      footer={<SFProBody>The footer</SFProBody>}
      overlay={<SFProBody>The overlay</SFProBody>}
      contentStyle={{ paddingBottom: 16 }}
    >
      <SFProBody>The content</SFProBody>
    </ScrollScreen>,
  );
}

describe("ScrollScreen", () => {
  it("shows its header, content, footer, and overlay", () => {
    renderPage();

    for (const text of ["The header", "The content", "The footer", "The overlay"]) {
      expect(screen.getByText(text)).toBeVisible();
    }
  });

  it("runs its scroll view the screen's full width, with no side inset around it", () => {
    renderPage();

    const scroll = screen.getByTestId("a-page-scroll");
    expect(scroll).not.toHaveStyle({ paddingHorizontal: PAGE_INSET });
    // The page around it: the screen's own frame, inset only top and bottom.
    const page = screen.getByTestId("a-page").children[0];
    expect(typeof page === "object" && StyleSheet.flatten(page.props.style)).not.toMatchObject({
      paddingHorizontal: PAGE_INSET,
    });
  });

  it("puts the page inset on the scroll's content", () => {
    renderPage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-scroll").props.contentContainerStyle as object,
    );
    expect(content).toMatchObject({ paddingHorizontal: PAGE_INSET, paddingBottom: 16 });
  });

  it("puts the page inset on its header and footer, so all three line up", () => {
    renderPage();

    expect(screen.getByTestId("a-page-header")).toHaveStyle({ paddingHorizontal: PAGE_INSET });
    expect(screen.getByTestId("a-page-foot")).toHaveStyle({ paddingHorizontal: PAGE_INSET });
  });
});
