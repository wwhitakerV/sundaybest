import { BookOpen } from "lucide-react-native";
import { render, screen } from "@tests/helpers/render";

import { StudyStepNode, type StudyStepNodeProps } from "@/features/plans/components/StudyStepNode";
import { lightTheme } from "@/theme/tokens";

const { colors } = lightTheme;

function renderNode(status: StudyStepNodeProps["status"]) {
  return render(<StudyStepNode testID="a-node" status={status} icon={BookOpen} />);
}

describe("StudyStepNode", () => {
  it("sets a done step on a soft disc", () => {
    renderNode("done");

    expect(screen.getByTestId("a-node")).toHaveStyle({ backgroundColor: colors.surface });
  });

  it("ticks a done step, in place of its icon", () => {
    renderNode("done");

    expect(screen.getByTestId("a-node-done")).toBeOnTheScreen();
    expect(screen.queryByTestId("a-node-icon")).toBeNull();
  });

  it("fills the step you're on in SundayBest red", () => {
    renderNode("current");

    expect(screen.getByTestId("a-node")).toHaveStyle({ backgroundColor: colors.accent });
  });

  it("keeps the icon of the step you're on", () => {
    renderNode("current");

    expect(screen.getByTestId("a-node-icon")).toBeOnTheScreen();
  });

  it("rings a step still to come, with no fill", () => {
    renderNode("upcoming");

    expect(screen.getByTestId("a-node")).toHaveStyle({
      backgroundColor: "transparent",
      borderColor: colors.sequenceLine,
    });
  });

  it("locks a locked day's step: a lock in place of its icon", () => {
    renderNode("locked");

    expect(screen.getByTestId("a-node-lock")).toBeOnTheScreen();
    expect(screen.queryByTestId("a-node-icon")).toBeNull();
  });

  it.each(["done", "upcoming", "locked"] as const)(
    "keeps SundayBest red off a %s step",
    (status) => {
      renderNode(status);

      expect(screen.getByTestId("a-node")).not.toHaveStyle({ backgroundColor: colors.accent });
    },
  );
});
