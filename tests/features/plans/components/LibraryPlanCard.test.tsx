import Svg from "react-native-svg";
import { render, screen, fireEvent, within } from "@tests/helpers/render";

import {
  LibraryPlanCard,
  type LibraryPlanCardProps,
} from "@/features/plans/components/LibraryPlanCard";
import { lightTheme } from "@/theme/tokens";

function renderCard(props: Partial<LibraryPlanCardProps> = {}) {
  return render(
    <LibraryPlanCard
      title="Still Praying"
      church="VOUS Church"
      thumbnailUrl={null}
      look={{ status: "In progress", detail: "Day 2 of 6", summary: "In progress · Day 2 of 6" }}
      percent={33}
      done={false}
      onPress={() => undefined}
      testID="a-card"
      thumbnailTestID="a-card-thumb"
      progressTestID="a-card-progress"
      actionTestID="a-card-action"
      {...props}
    />,
  );
}

describe("LibraryPlanCard", () => {
  it("shows a progress dial at the plan's percent", () => {
    renderCard();

    expect(screen.getByTestId("a-card-progress")).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 33 }),
    );
  });

  it("names its church under its title", () => {
    renderCard();

    expect(screen.getByText("VOUS Church")).toBeOnTheScreen();
  });

  it("leaves the church out when it isn't known", () => {
    renderCard({ church: null });

    expect(screen.queryByText("VOUS Church")).toBeNull();
  });

  it.each(["Continue", "Start"] as const)(
    "shows %s as its action, labelled with the title",
    (label) => {
      renderCard({ action: { label, onPress: jest.fn() } });

      const button = screen.getByTestId("a-card-action");
      expect(button).toHaveTextContent(label);
      expect(button).toHaveProp("accessibilityRole", "button");
      expect(button).toHaveProp("accessibilityLabel", `${label} Still Praying`);
    },
  );

  it("runs its action once, and doesn't open the plan, when the action is pressed", () => {
    const onAction = jest.fn();
    const onPress = jest.fn();
    renderCard({ action: { label: "Start", onPress: onAction }, onPress });

    fireEvent.press(screen.getByTestId("a-card-action"));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows no action without one", () => {
    renderCard();

    expect(screen.queryByTestId("a-card-action")).toBeNull();
  });

  it("sits on the card's soft fill, with no edge", () => {
    renderCard();

    expect(screen.getByTestId("a-card")).toHaveStyle({
      backgroundColor: lightTheme.colors.surface,
      borderWidth: 0,
    });
  });

  it("says the day it's on beside its dial, without its status", () => {
    renderCard();

    expect(screen.getByText("Day 2 of 6")).toBeOnTheScreen();
    expect(screen.queryByText(/In progress/)).toBeNull();
  });

  it("marks a plan not yet done with a grey flame in its dial", () => {
    renderCard();

    expect(
      within(screen.getByTestId("a-card-progress-flame")).UNSAFE_getByType(Svg).props.stroke,
    ).toBe(lightTheme.colors.textMuted);
  });

  it("marks a finished plan with a red flame in its dial", () => {
    renderCard({ done: true });

    expect(
      within(screen.getByTestId("a-card-progress-flame")).UNSAFE_getByType(Svg).props.stroke,
    ).toBe(lightTheme.colors.accent);
  });

  it("sizes the flame to the dial: 17pt", () => {
    renderCard();

    expect(
      within(screen.getByTestId("a-card-progress-flame")).UNSAFE_getByType(Svg).props.width,
    ).toBe(17);
  });

  it("calls onPress when the card itself is pressed", () => {
    const onPress = jest.fn();
    renderCard({ onPress });

    fireEvent.press(screen.getByTestId("a-card"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("offers its action to VoiceOver as an action on the card", () => {
    const onAction = jest.fn();
    renderCard({ action: { label: "Start", onPress: onAction } });

    fireEvent(screen.getByTestId("a-card"), "accessibilityAction", {
      nativeEvent: { actionName: "activate-action" },
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("a-card")).toHaveProp("accessibilityActions", [
      { name: "activate-action", label: "Start" },
    ]);
  });

  it("offers VoiceOver no action without one", () => {
    renderCard();

    expect(screen.getByTestId("a-card").props.accessibilityActions ?? []).toEqual([]);
  });
});
