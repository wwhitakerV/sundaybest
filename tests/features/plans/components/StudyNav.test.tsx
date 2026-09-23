import { render, screen, fireEvent } from "@tests/helpers/render";

import { StudyNav } from "@/features/plans/components/StudyNav";

// StudyNav fades in from opacity 0 on mount (useStudyNavEntrance). Jest's
// Reanimated mock never runs that animation, so everything inside the nav
// stays at its opening frame; these tests assert presence
// (`toBeOnTheScreen`), not visibility.
describe("StudyNav", () => {
  it("is addressable as the given testID", () => {
    render(<StudyNav testID="study-nav" step={0} onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByTestId("study-nav")).toBeOnTheScreen();
  });

  it("renders one dot per study step", () => {
    render(<StudyNav testID="study-nav" step={0} onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByTestId("study-nav-dots-dot-0")).toBeOnTheScreen();
    expect(screen.getByTestId("study-nav-dots-dot-1")).toBeOnTheScreen();
    expect(screen.getByTestId("study-nav-dots-dot-2")).toBeOnTheScreen();
    expect(screen.getByTestId("study-nav-dots-dot-3")).toBeOnTheScreen();
    expect(screen.queryByTestId("study-nav-dots-dot-4")).toBeNull();
  });

  it("widens the dot for the current step into a pill", () => {
    render(<StudyNav testID="study-nav" step={2} onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByTestId("study-nav-dots-dot-2")).toHaveStyle({ width: 20 });
  });

  it("shows Previous and Next labels by default", () => {
    render(<StudyNav testID="study-nav" step={1} onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByText("Previous")).toBeOnTheScreen();
    expect(screen.getByText("Next")).toBeOnTheScreen();
  });

  it("calls onPrevious when the previous control is pressed", () => {
    const onPrevious = jest.fn();
    render(<StudyNav testID="study-nav" step={1} onPrevious={onPrevious} onNext={jest.fn()} />);

    fireEvent.press(screen.getByTestId("study-nav-prev-button"));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("calls onNext when the next control is pressed", () => {
    const onNext = jest.fn();
    render(<StudyNav testID="study-nav" step={1} onPrevious={jest.fn()} onNext={onNext} />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  describe("with a finish action", () => {
    it("shows Finish with a trophy icon instead of the next arrow", () => {
      render(
        <StudyNav
          testID="study-nav"
          step={3}
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
          step={3}
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
    render(<StudyNav testID="study-nav" step={0} onPrevious={jest.fn()} onNext={jest.fn()} />);

    expect(await screen.findByTestId("study-nav-sparks")).toBeOnTheScreen();
  });
});
