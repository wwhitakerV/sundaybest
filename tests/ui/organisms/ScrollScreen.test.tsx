import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@tests/helpers/render";

import { SFProBody } from "@/ui/typography/SFProBody";
import { EDGE_FADE, GRADUAL_FADE } from "@/ui/organisms/frame-edges";
import {
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "@/ui/organisms/floatingNavBar";
import { PAGE_INSET, PAGE_TOP } from "@/ui/organisms/Screen";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";

function renderPage(extra: { feedback?: boolean } = {}) {
  return render(
    <ScrollScreen
      testID="a-page"
      header={<SFProBody>The header</SFProBody>}
      footer={<SFProBody>The footer</SFProBody>}
      {...(extra.feedback && { feedback: <SFProBody>The verdict</SFProBody> })}
      overlay={<SFProBody>The overlay</SFProBody>}
      contentStyle={{ paddingBottom: 16 }}
    >
      <SFProBody>The content</SFProBody>
    </ScrollScreen>,
  );
}

function layOut(testID: string, height: number) {
  fireEvent(screen.getByTestId(testID), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height } },
  });
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

    expect(screen.getByTestId("a-page-scroll")).not.toHaveStyle({ paddingHorizontal: PAGE_INSET });
  });

  it("puts the page inset on the scroll's content", () => {
    renderPage();

    const content = StyleSheet.flatten(
      screen.getByTestId("a-page-scroll").props.contentContainerStyle as object,
    );
    expect(content).toMatchObject({ paddingHorizontal: PAGE_INSET, paddingBottom: 16 });
  });

  it("floats its header over the top of the scroll, inset like the content", () => {
    renderPage();

    expect(screen.getByTestId("a-page-header")).toHaveStyle({
      position: "absolute",
      top: 0,
      paddingHorizontal: PAGE_INSET,
    });
  });

  it("fades the top edge out below the header, solid behind it", () => {
    renderPage();
    layOut("a-page-header", 100);

    expect(screen.getByTestId("a-page-top-fade", { includeHiddenElements: true })).toHaveStyle({
      height: 100 + EDGE_FADE,
    });
  });

  it("starts its content clear of the header and its fade", () => {
    renderPage();
    layOut("a-page-header", 100);

    expect(screen.getByTestId("a-page-top-clearance")).toHaveStyle({ height: 100 + EDGE_FADE });
  });

  it("starts its content at the page top when there is no header", () => {
    render(
      <ScrollScreen testID="a-page">
        <SFProBody>The content</SFProBody>
      </ScrollScreen>,
    );

    expect(screen.getByTestId("a-page-top-clearance")).toHaveStyle({ height: PAGE_TOP });
  });

  it("puts its footer in the dock, where the tab bar's pill sits", () => {
    renderPage();

    expect(screen.getByTestId("a-page-dock")).toHaveStyle({ bottom: getFloatingNavBarBottom(0) });
    expect(screen.getByTestId("a-page-dock")).toContainElement(screen.getByText("The footer"));
  });

  it("ends its content clear of the dock and its fade", () => {
    renderPage();

    expect(screen.getByTestId("a-page-bottom-clearance")).toHaveStyle({
      height: getFloatingNavBarTintHeight(getFloatingNavBarBottom(0)),
    });
  });

  it("shows a verdict panel in the dock's place, pinned to the screen's bottom", () => {
    renderPage({ feedback: true });

    expect(screen.queryByTestId("a-page-dock")).toBeNull();
    expect(screen.getByTestId("a-page-panel")).toHaveStyle({ position: "absolute", bottom: 0 });
    expect(screen.getByText("The verdict")).toBeVisible();
  });

  it("fades the bottom edge above the home indicator when nothing is at the foot", () => {
    render(
      <ScrollScreen testID="a-page">
        <SFProBody>The content</SFProBody>
      </ScrollScreen>,
    );

    expect(screen.getByTestId("a-page-bottom-fade", { includeHiddenElements: true })).toHaveStyle({
      height: EDGE_FADE,
    });
  });

  describe("with a gradual header fade", () => {
    function renderGradual() {
      return render(
        <ScrollScreen
          testID="a-page"
          header={<SFProBody>The header</SFProBody>}
          headerFade="gradual"
        >
          <SFProBody>The content</SFProBody>
        </ScrollScreen>,
      );
    }

    it("keeps the fade inside the header's block, as room at its foot", () => {
      renderGradual();

      expect(screen.getByTestId("a-page-header")).toHaveStyle({ paddingBottom: GRADUAL_FADE });
    });

    it("ends the fade at the header's bottom edge, content starting there", () => {
      renderGradual();
      layOut("a-page-header", 160);

      expect(screen.getByTestId("a-page-top-fade", { includeHiddenElements: true })).toHaveStyle({
        height: 160,
      });
      expect(screen.getByTestId("a-page-top-clearance")).toHaveStyle({ height: 160 });
    });
  });

  describe("with a soft header fade", () => {
    it("ends the header at its last row, the fade running 10pt past it", () => {
      render(
        <ScrollScreen
          testID="a-page"
          header={<SFProBody>The header</SFProBody>}
          headerFade={{ kind: "soft", reach: 36 }}
        >
          <SFProBody>The content</SFProBody>
        </ScrollScreen>,
      );
      layOut("a-page-header", 150);

      expect(screen.getByTestId("a-page-header")).not.toHaveStyle({ paddingBottom: GRADUAL_FADE });
      expect(screen.getByTestId("a-page-top-fade", { includeHiddenElements: true })).toHaveStyle({
        height: 160,
      });
      expect(screen.getByTestId("a-page-top-clearance")).toHaveStyle({ height: 160 });
    });
  });
});
