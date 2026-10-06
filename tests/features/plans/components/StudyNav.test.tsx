import { render, screen, fireEvent } from "@tests/helpers/render";

import { tapFeedback } from "@/core/haptics/haptics";
import { StudyNav } from "@/features/plans/components/StudyNav";
import { FLOATING_NAV_BAR } from "@/ui/organisms/floatingNavBar";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));

/** "← Previous" (96) and the pill's padding either side (20 + 20). */
const PILL_WIDTH = 136;

// StudyNav fades in from opacity 0 on mount (useStudyNavEntrance). Jest's
// Reanimated mock never runs that animation, so everything inside the nav
// stays at its opening frame; these tests assert presence
// (`toBeOnTheScreen`), not visibility.
describe("StudyNav", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is addressable as the given testID", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByTestId("study-nav")).toBeOnTheScreen();
  });

  it("floats two separate pills, Previous at the left and Next at the right", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByTestId("study-nav")).toHaveStyle({
      flexDirection: "row",
      justifyContent: "space-between",
    });
    expect(screen.queryByTestId("study-nav-tint")).toBeNull();
  });

  it("shows no dots between them", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.queryByTestId("study-nav-dots")).toBeNull();
    expect(screen.queryByTestId("study-nav-dots-dot-0")).toBeNull();
  });

  it("makes each pill as tall as the tab bar's, and as wide as Previous with its padding", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    for (const id of ["study-nav-prev-button", "study-nav-next-button"]) {
      expect(screen.getByTestId(id)).toHaveStyle({
        height: FLOATING_NAV_BAR.capsuleHeight,
        width: PILL_WIDTH,
      });
    }
  });

  it("keeps Next's width when it turns into Finish", () => {
    render(
      <StudyNav
        testID="study-nav"

        finishLabel="Finish"
        onPrevious={jest.fn()}
        onNext={jest.fn()}
      />,
    );

    expect(screen.getByTestId("study-nav-next-button")).toHaveStyle({ width: PILL_WIDTH });
  });

  it("shows Previous and Next labels by default", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByText("Previous")).toBeOnTheScreen();
    expect(screen.getByText("Next")).toBeOnTheScreen();
  });

  it("makes no haptic of its own as Previous and Next are pressed", () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    fireEvent.press(screen.getByTestId("study-nav-prev-button"));
    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(tapFeedback).not.toHaveBeenCalled();
  });

  it("calls onPrevious when the previous control is pressed", () => {
    const onPrevious = jest.fn();
    render(<StudyNav testID="study-nav" onPrevious={onPrevious} onNext={jest.fn()} />);

    fireEvent.press(screen.getByTestId("study-nav-prev-button"));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("calls onNext when the next control is pressed", () => {
    const onNext = jest.fn();
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={onNext} />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  describe("with a finish action", () => {
    it("shows Finish with a trophy icon instead of the next arrow", () => {
      render(
        <StudyNav
          testID="study-nav"

          onPrevious={jest.fn()}
          onNext={jest.fn()}
          finishLabel="Finish"
        />,
      );

      expect(screen.getByText("Finish")).toBeOnTheScreen();
      expect(screen.queryByText("Next")).toBeNull();
    });

    it("calls onNext when Finish is pressed", () => {
      const onNext = jest.fn();
      render(
        <StudyNav
          testID="study-nav"

          onPrevious={jest.fn()}
          onNext={onNext}
          finishLabel="Finish"
        />,
      );

      fireEvent.press(screen.getByTestId("study-nav-next-button"));

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the spark burst once the entrance settles", async () => {
    render(<StudyNav testID="study-nav" onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(await screen.findByTestId("study-nav-sparks")).toBeOnTheScreen();
  });
});
