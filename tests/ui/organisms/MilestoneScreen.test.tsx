import { Text, View } from "react-native";
import { render, screen } from "@tests/helpers/render";

import {
  MILESTONE_LAYOUT,
  MilestoneScreen,
  type MilestoneScreenProps,
} from "@/ui/organisms/MilestoneScreen";
import { PAGE_INSET, PAGE_TOP } from "@/ui/organisms/Screen";
import { getFloatingNavBarBottom } from "@/ui/organisms/floatingNavBar";

function renderMilestone(props: Partial<MilestoneScreenProps> = {}) {
  return render(
    <MilestoneScreen
      testID="a-milestone"
      mark={<View testID="a-mark" />}
      title="Day 2 done"
      {...props}
    />,
  );
}

describe("MilestoneScreen", () => {
  describe("its mark", () => {
    it("sits the same distance below the top of the safe area on every page", () => {
      renderMilestone();

      expect(screen.getByTestId("a-milestone-body")).toHaveStyle({
        paddingTop: MILESTONE_LAYOUT.markTop - PAGE_TOP,
      });
    });

    it("doesn't move for a header", () => {
      renderMilestone({ header: <View testID="a-header" /> });

      expect(screen.getByTestId("a-milestone-body")).toHaveStyle({
        paddingTop: MILESTONE_LAYOUT.markTop - PAGE_TOP,
      });
    });

    it("has a slot of its own size, whatever is drawn in it", () => {
      renderMilestone();

      expect(screen.getByTestId("a-milestone-mark")).toHaveStyle({
        width: MILESTONE_LAYOUT.markSize,
        height: MILESTONE_LAYOUT.markSize,
      });
    });

    it("is the 96pt, 160pt mark Day Complete set", () => {
      expect(MILESTONE_LAYOUT.markTop).toBe(96);
      expect(MILESTONE_LAYOUT.markSize).toBe(160);
    });
  });

  it("floats its header over the top, at the page's inset", () => {
    renderMilestone({ header: <View testID="a-header" /> });

    expect(screen.getByTestId("a-milestone-header")).toHaveStyle({
      position: "absolute",
      top: PAGE_TOP,
      left: PAGE_INSET,
      right: PAGE_INSET,
    });
  });

  it("draws no header slot without one", () => {
    renderMilestone();

    expect(screen.queryByTestId("a-milestone-header")).toBeNull();
  });

  it("heads the page with its title", () => {
    renderMilestone();

    expect(screen.getByRole("header", { name: "Day 2 done" })).toBeVisible();
  });

  it("shows a subtitle under the title when given one", () => {
    renderMilestone({ subtitle: "3 questions on today's study" });

    expect(screen.getByText("3 questions on today's study")).toBeVisible();
  });

  it("spaces mark, title and badge 20pt apart", () => {
    renderMilestone({ badge: <View testID="a-badge" /> });

    expect(screen.getByTestId("a-milestone-heading")).toHaveStyle({
      gap: MILESTONE_LAYOUT.headingGap,
    });
    expect(MILESTONE_LAYOUT.headingGap).toBe(20);
  });

  it("sets the subtitle 8pt under the title", () => {
    renderMilestone({ subtitle: "A line" });

    expect(screen.getByTestId("a-milestone-titles")).toHaveStyle({
      gap: MILESTONE_LAYOUT.subtitleGap,
    });
    expect(MILESTONE_LAYOUT.subtitleGap).toBe(8);
  });

  it("starts its content 32pt under the heading, each part 16pt apart", () => {
    renderMilestone({ children: <Text>Inside</Text> });

    expect(screen.getByTestId("a-milestone-content")).toHaveStyle({
      marginTop: MILESTONE_LAYOUT.contentTop,
      gap: MILESTONE_LAYOUT.contentGap,
    });
    expect(MILESTONE_LAYOUT.contentTop).toBe(32);
    expect(MILESTONE_LAYOUT.contentGap).toBe(16);
    expect(screen.getByText("Inside")).toBeVisible();
  });

  it("puts its button in the dock, where the tab bar's pill sits", () => {
    renderMilestone({ footer: <View testID="a-button" /> });

    expect(screen.getByTestId("a-milestone-dock")).toHaveStyle({
      bottom: getFloatingNavBarBottom(0),
    });
    expect(screen.getByTestId("a-milestone-dock")).toContainElement(screen.getByTestId("a-button"));
  });
});
