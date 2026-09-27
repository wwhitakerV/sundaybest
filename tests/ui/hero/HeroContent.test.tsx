import { render, screen, fireEvent } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { HeroContent, type HeroContentProps } from "@/ui/hero/HeroContent";

const TEST_IDS = {
  content: "a-hero-content",
  status: "a-hero-status",
  title: "a-hero-title",
  continueButton: "a-hero-continue",
  today: "a-hero-today",
  progress: "a-hero-progress",
};

function renderContent(overrides: Partial<HeroContentProps> = {}) {
  const props: HeroContentProps = {
    title: "Today I Choose to Be a Blessing",
    church: "VOUS Church",
    words: {
      status: "IN PROGRESS · DAY 2 OF 6",
      action: "Continue Day 2",
      today: "Today: Grace is received · 9 min",
    },
    totalDays: 6,
    completedDayCount: 1,
    light: true,
    onContinue: () => undefined,
    testIDs: TEST_IDS,
    ...overrides,
  };
  return render(<HeroContent {...props} />);
}

describe("HeroContent", () => {
  it("says where the plan stands, its title, and its church", () => {
    renderContent();

    expect(screen.getByTestId("a-hero-status")).toHaveTextContent("IN PROGRESS · DAY 2 OF 6");
    expect(screen.getByRole("header", { name: "Today I Choose to Be a Blessing" })).toBeVisible();
    expect(screen.getByText("VOUS Church")).toBeVisible();
  });

  it("puts Continue under the title and church, right above what today holds", () => {
    renderContent();

    const order = screen.getAllByText(/./).map((text) => text.props.children as unknown);
    expect(order.indexOf("Continue Day 2")).toBeGreaterThan(order.indexOf("VOUS Church"));
    expect(order.indexOf("Continue Day 2")).toBe(
      order.indexOf("Today: Grace is received · 9 min") - 1,
    );
  });

  it("leaves the church out when there isn't one", () => {
    renderContent({ church: null });

    expect(screen.queryByText("VOUS Church")).toBeNull();
  });

  it("sets its words on a soft shadow, dark behind white type", () => {
    renderContent({ light: true });

    expect(screen.getByTestId("a-hero-status")).toHaveStyle({
      textShadowColor: lightTheme.colors.inkHaloOnDark,
      textShadowRadius: 12,
    });
  });

  it("…and light behind black type", () => {
    renderContent({ light: false });

    expect(screen.getByTestId("a-hero-title")).toHaveStyle({
      color: lightTheme.colors.inkOnLight,
      textShadowColor: lightTheme.colors.inkHaloOnLight,
    });
  });

  it("continues with the plan", () => {
    const onContinue = jest.fn();
    renderContent({ onContinue });

    fireEvent.press(screen.getByTestId("a-hero-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("a-hero-continue")).toHaveAccessibleName("Continue Day 2");
  });

  it("lets Continue go while it's handed over elsewhere", () => {
    renderContent({ continueShown: false });

    expect(screen.getByTestId("a-hero-continue-slot")).toHaveProp("pointerEvents", "none");
  });

  it("reports where Continue sits", () => {
    const onContinueLayout = jest.fn();
    renderContent({ onContinueLayout });

    fireEvent(screen.getByTestId("a-hero-continue-slot"), "layout", {
      nativeEvent: { layout: { x: 0, y: 320, width: 200, height: 44 } },
    });

    expect(onContinueLayout).toHaveBeenCalledTimes(1);
  });

  it("says what today holds, and how far through the plan is", () => {
    renderContent();

    expect(screen.getByTestId("a-hero-today")).toHaveTextContent(
      "Today: Grace is received · 9 min",
    );
    expect(screen.getByLabelText("1 of 6 days done")).toBeVisible();
    expect(screen.getByTestId("a-hero-progress")).toBeOnTheScreen();
  });

  it("takes its placement from the hero", () => {
    renderContent({ style: { marginTop: 32 } });

    expect(screen.getByTestId("a-hero-content")).toHaveStyle({ marginTop: 32 });
  });

  it("gives the title a touch more room under where the plan stands", () => {
    renderContent();

    // 2pt on top of the 6pt between the status, title, and church.
    expect(screen.getByTestId("a-hero-status")).toHaveStyle({ marginBottom: 2 });
  });

  it("sets Continue apart from the plan's name", () => {
    renderContent();

    expect(screen.getByTestId("a-hero-continue-slot")).toHaveStyle({ marginTop: 24 });
  });

  it("keeps what today holds close under Continue, as its caption", () => {
    renderContent();

    expect(screen.getByTestId("a-hero-continue-slot")).toHaveStyle({ marginBottom: 10 });
  });

  it("sets the day-by-day line well apart, a thing of its own", () => {
    renderContent();

    expect(screen.getByTestId("a-hero-today")).toHaveStyle({ marginBottom: 28 });
  });

  it("can leave the day-by-day line out, for a page that shows the days itself", () => {
    renderContent({ showProgress: false });

    expect(screen.queryByTestId("a-hero-progress")).toBeNull();
    expect(screen.queryByLabelText("1 of 6 days done")).toBeNull();
  });

  it("then ends on what today holds, without the room the line would've had", () => {
    renderContent({ showProgress: false });

    expect(screen.getByTestId("a-hero-today")).not.toHaveStyle({ marginBottom: 28 });
  });
});
