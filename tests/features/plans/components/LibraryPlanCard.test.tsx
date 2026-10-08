import { render, screen, fireEvent } from "@tests/helpers/render";

import {
  LibraryPlanCard,
  type LibraryPlanCardProps,
} from "@/features/plans/components/LibraryPlanCard";
import { lightTheme } from "@/theme/tokens";

const SERMON_COLOURS = ["#C2185B", "#7B1E4A"];

function renderCard(props: Partial<LibraryPlanCardProps> = {}) {
  return render(
    <LibraryPlanCard
      title="Still Praying"
      church="VOUS Church"
      thumbnailUrl="https://example.com/still-praying.jpg"
      colors={SERMON_COLOURS}
      look={{ status: "In progress", detail: "Day 2 of 6", summary: "In progress · Day 2 of 6" }}
      percent={33}
      done={false}
      onPress={() => undefined}
      testID="a-card"
      thumbnailTestID="a-card-thumb"
      progressTestID="a-card-progress"
      {...props}
    />,
  );
}

describe("LibraryPlanCard", () => {
  it("is set on its sermon's own colour", () => {
    renderCard();

    expect(screen.getByTestId("a-card")).toHaveStyle({ backgroundColor: "#C2185B" });
  });

  it("shows the sermon's artwork across its top", () => {
    renderCard();

    expect(screen.getByTestId("a-card-thumb")).toBeOnTheScreen();
  });

  it("is just its panel when there's no artwork", () => {
    renderCard({ thumbnailUrl: null });

    expect(screen.queryByTestId("a-card-thumb")).toBeNull();
    expect(screen.getByTestId("a-card-panel")).toBeOnTheScreen();
  });

  it("says what the plan is, whose it is, and where it stands, in white on its panel", () => {
    renderCard();

    expect(screen.getByText("Still Praying")).toHaveStyle({ color: lightTheme.colors.inkOnDark });
    expect(screen.getByText("VOUS Church")).toBeVisible();
    expect(screen.getByText("Day 2 of 6")).toBeVisible();
  });

  it("darkens its foot in one continuous gradient, with no panel inside the card", () => {
    renderCard();

    expect(screen.getByTestId("a-card-scrim")).toBeOnTheScreen();
    expect(screen.queryByTestId("a-card-panel-shade")).toBeNull();
    expect(screen.getByTestId("a-card-panel")).not.toHaveStyle({
      borderRadius: expect.any(Number) as number,
    });
    expect(screen.getByTestId("a-card-panel")).not.toHaveStyle({
      margin: expect.any(Number) as number,
    });
  });

  it("shows its progress as a ring with the percent inside, at the end of its last line", () => {
    renderCard();

    expect(screen.getByTestId("a-card-progress")).toHaveStyle({ width: 40, height: 40 });
    expect(screen.queryByTestId("a-card-progress-disc")).toBeNull();
    expect(screen.getByTestId("a-card-status")).toContainElement(
      screen.getByTestId("a-card-progress"),
    );
    expect(screen.getByTestId("a-card-progress")).toHaveTextContent("33%");
  });

  it("says 0% on a plan not started, not just its length", () => {
    renderCard({
      percent: 0,
      look: { status: "Not started", detail: "7 days", summary: "Not started · 7 days" },
    });

    expect(screen.getByTestId("a-card-progress")).toHaveTextContent("0%");
  });

  it("says 100% on a finished plan", () => {
    renderCard({ done: true, percent: 40 });

    expect(screen.getByTestId("a-card-progress")).toHaveTextContent("100%");
  });

  it("lets its words run the panel's full width", () => {
    renderCard();

    expect(screen.getByTestId("a-card-words")).toHaveStyle({ flex: 1 });
    expect(screen.queryByTestId("a-card-tile")).toBeNull();
  });

  it("sets its title a touch lighter than bold", () => {
    renderCard();

    expect(screen.getByText("Still Praying")).toHaveStyle(lightTheme.typography.offerTitle);
    expect(lightTheme.typography.offerTitle.fontWeight).toBe("600");
  });

  it("opens the plan when pressed", () => {
    const onPress = jest.fn();
    renderCard({ onPress });

    fireEvent.press(screen.getByTestId("a-card"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("offers Continue to VoiceOver, as the first card does", () => {
    const onContinue = jest.fn();
    renderCard({ action: { label: "Continue", onPress: onContinue } });

    fireEvent(screen.getByTestId("a-card"), "accessibilityAction", {
      nativeEvent: { actionName: "activate-action" },
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("sets its church a size under its title's line, as supporting copy", () => {
    renderCard();

    expect(screen.getByText("VOUS Church")).toHaveStyle(lightTheme.typography.cardDetail);
  });
});
