import { Text, View } from "react-native";
import { act, render, screen } from "@tests/helpers/render";

import { motion } from "@/theme";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";

function Page({ pending }: { pending: boolean }) {
  return (
    <SkeletonHandoff testID="page" pending={pending} skeleton={<View testID="bones" />}>
      <Text>The content</Text>
    </SkeletonHandoff>
  );
}

describe("SkeletonHandoff", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the skeleton, and not the content, while it's pending", () => {
    render(<Page pending />);

    expect(screen.getByTestId("bones")).toBeOnTheScreen();
    expect(screen.queryByText("The content")).toBeNull();
  });

  it("shows the content, with no skeleton, when it was ready from the start", () => {
    render(<Page pending={false} />);

    expect(screen.getByText("The content")).toBeVisible();
    expect(screen.queryByTestId("page-leaving", { includeHiddenElements: true })).toBeNull();
  });

  it("doesn't fade in content that never waited", () => {
    render(<Page pending={false} />);

    expect(screen.getByTestId("page-content")).not.toHaveStyle({
      animationDuration: motion.handoffMs,
    });
  });

  it("never snaps the skeleton away: it fades out over the content as the content fades in", () => {
    const { rerender } = render(<Page pending />);
    rerender(<Page pending={false} />);

    expect(screen.getByText("The content")).toBeOnTheScreen();
    expect(screen.getByTestId("page-leaving", { includeHiddenElements: true })).toHaveStyle({
      animationDuration: motion.handoffMs,
    });
    expect(screen.getByTestId("page-content")).toHaveStyle({ animationDuration: motion.handoffMs });
  });

  it("keeps the leaving skeleton from VoiceOver and touches", () => {
    const { rerender } = render(<Page pending />);
    rerender(<Page pending={false} />);

    const leaving = screen.getByTestId("page-leaving", { includeHiddenElements: true });
    expect(leaving).toHaveProp("pointerEvents", "none");
    expect(screen.queryByTestId("bones")).toBeNull();
  });

  it("lets the skeleton go once it has faded", () => {
    jest.useFakeTimers();
    const { rerender } = render(<Page pending />);
    rerender(<Page pending={false} />);

    act(() => {
      jest.advanceTimersByTime(motion.handoffMs);
    });

    expect(screen.queryByTestId("page-leaving", { includeHiddenElements: true })).toBeNull();
  });
});
