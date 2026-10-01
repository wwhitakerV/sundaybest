import { render, screen, fireEvent } from "@tests/helpers/render";

import {
  ActivePlanHero,
  type ActivePlanHeroProps,
} from "@/features/home/components/ActivePlanHero";

function renderHero(overrides: Partial<ActivePlanHeroProps> = {}) {
  const props: ActivePlanHeroProps = {
    plan: {
      title: "Still Praying",
      church: "Harbor Light Church",
      thumbnailUrl: "still-praying.jpg",
      colors: ["#48443F", "#654F46", "#111117"],
      words: {
        status: "IN PROGRESS · DAY 2 OF 6",
        action: "Continue Day 2",
        today: "Today: Grace is received · 9 min",
      },
      currentDay: 2,
      totalDays: 6,
      completedDayCount: 1,
    },
    href: "/",
    onContinue: () => undefined,
    ...overrides,
  };
  return render(<ActivePlanHero {...props} />);
}

describe("ActivePlanHero", () => {
  it("washes the sermon's still faintly across the hero, as Plan Detail does", () => {
    renderHero();

    expect(screen.getByTestId("home-tab-active-hero-backdrop-underlay")).toHaveProp("opacity", 0.2);
  });

  it("sets its words as Plan Detail does, on a soft shadow", () => {
    renderHero();

    expect(screen.getByTestId("home-tab-active-plan-status")).toHaveStyle({
      textShadowRadius: 12,
    });
  });

  it("lays the words' own colour behind them once the hero and its artwork are measured", () => {
    renderHero({ motion: { slotHeight: 700 } });

    fireEvent(screen.getByTestId("home-tab-active-plan"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 283, height: 159 } },
    });

    expect(screen.getByTestId("home-tab-active-hero-content-fade-fill").props.mask).toBeTruthy();
  });

  it("draws no colour behind the words before the artwork's measured — it'd cover it", () => {
    renderHero({ motion: { slotHeight: 700 } });

    expect(screen.queryByTestId("home-tab-active-hero-content-fade")).toBeNull();
  });

  it("spaces its words below the artwork as Plan Detail does", () => {
    renderHero();

    expect(screen.getByTestId("home-tab-active-plan-content")).toHaveStyle({ marginTop: 32 });
  });

  it("leaves as much room under its last line as Plan Detail does", () => {
    renderHero();

    expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({ paddingBottom: 40 });
  });

  it("still continues with the plan", () => {
    const onContinue = jest.fn();
    renderHero({ onContinue });

    fireEvent.press(screen.getByTestId("home-tab-continue-button"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
