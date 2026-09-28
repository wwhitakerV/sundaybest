import { render, screen, fireEvent, within } from "@tests/helpers/render";

import { SelectedDay, type SelectedDayProps } from "@/features/plans/components/SelectedDay";
import type { DayHeaderLook, QuickCheckLook, StudyStepLook } from "@/features/plans/logic/day-rail";
import { lightTheme } from "@/theme/tokens";

const { colors, typography } = lightTheme;

const STUDY = [
  ["read", "Read"],
  ["scripture", "Scripture"],
  ["reflect", "Reflect"],
  ["pray", "Pray"],
] as const;

type Status = StudyStepLook["status"];

function studySteps(statuses: readonly [Status, Status, Status, Status]): StudyStepLook[] {
  return STUDY.map(([key, label], index) => {
    const status = statuses.at(index) ?? "upcoming";
    return {
      key,
      label,
      detail: null,
      status,
      opens: status !== "locked",
      accessibilityLabel: `${label}, ${status}`,
    };
  });
}

function quickCheck(status: QuickCheckLook["status"]): QuickCheckLook {
  return {
    key: "quickCheck",
    label: "Quick Check",
    detail: null,
    status,
    opens: status !== "locked" && status !== "waiting",
    accessibilityLabel: `Quick Check, ${status}`,
  };
}

const TODAY: DayHeaderLook = { locked: false, meta: "5 min · 2 of 4 done" };
const LOCKED: DayHeaderLook = { locked: true, meta: "5 min" };

function renderDay(overrides: Partial<SelectedDayProps> = {}) {
  return render(
    <SelectedDay
      testID="a-day"
      contentKey="day-2"
      stepTestIDPrefix="a-step"
      title="Grace is received"
      header={TODAY}
      steps={studySteps(["done", "done", "current", "upcoming"])}
      quickCheck={quickCheck("waiting")}
      onOpenStep={() => undefined}
      {...overrides}
    />,
  );
}

describe("SelectedDay", () => {
  describe("its header", () => {
    it("heads the day with its title, largest", () => {
      renderDay();

      expect(screen.getByRole("header", { name: "Grace is received" })).toHaveStyle(
        typography.editorialTitle,
      );
    });

    it("says how long the day takes and how far through it is", () => {
      renderDay();

      expect(screen.getByText("5 min · 2 of 4 done")).toBeVisible();
    });

    it("mutes a locked day's title", () => {
      renderDay({
        header: LOCKED,
        steps: studySteps(["locked", "locked", "locked", "locked"]),
      });

      expect(screen.getByRole("header", { name: "Grace is received" })).toHaveStyle({
        color: colors.textMuted,
      });
    });
  });

  it("sets the day straight on the page, with no surface or edge of its own", () => {
    renderDay();

    const day = screen.getByTestId("a-day");
    expect(day).not.toHaveStyle({ backgroundColor: colors.surface });
    expect(day).not.toHaveStyle({ backgroundColor: colors.background });
    expect(day).not.toHaveStyle({ borderColor: colors.hairline });
  });

  it("runs the four study steps down one line, Read to Pray", () => {
    renderDay();

    const sequence = within(screen.getByTestId("a-day-steps"));
    for (const [key] of STUDY) {
      expect(sequence.getByTestId(`a-step-${key}`)).toBeOnTheScreen();
    }
  });

  it("starts the line at Read", () => {
    renderDay();

    expect(screen.getByTestId("a-step-read-line-in")).toHaveStyle({
      backgroundColor: "transparent",
    });
  });

  it("ends the line at Pray", () => {
    renderDay();

    expect(screen.getByTestId("a-step-pray-line-out")).toHaveStyle({
      backgroundColor: "transparent",
    });
  });

  it("gives every study step still to come the same neutral ring, whichever it is", () => {
    renderDay({ steps: studySteps(["upcoming", "upcoming", "upcoming", "upcoming"]) });

    for (const [key] of STUDY) {
      expect(screen.getByTestId(`a-step-${key}-node`)).toHaveStyle({
        backgroundColor: "transparent",
        borderColor: colors.sequenceLine,
      });
    }
  });

  it("stands out only the step you're on", () => {
    renderDay();

    expect(screen.getByTestId("a-step-reflect")).toHaveStyle({ backgroundColor: colors.surface });
    for (const key of ["read", "scripture", "pray"]) {
      expect(screen.getByTestId(`a-step-${key}`)).toHaveStyle({ backgroundColor: "transparent" });
    }
  });

  it("keeps the Quick Check out of the study's steps", () => {
    renderDay();

    expect(within(screen.getByTestId("a-day-steps")).queryByTestId("a-step-quickCheck")).toBeNull();
  });

  it("rules the Quick Check off after the study", () => {
    renderDay();

    const followUp = screen.getByTestId("a-day-follow-up");
    expect(within(followUp).getByTestId("a-step-quickCheck")).toBeOnTheScreen();
    expect(followUp).toHaveStyle({ borderTopColor: colors.divider });
  });

  it("leaves the follow-up out for a day without a Quick Check", () => {
    renderDay({ quickCheck: null });

    expect(screen.queryByTestId("a-day-follow-up")).toBeNull();
  });

  it("opens the study step pressed", () => {
    const onOpenStep = jest.fn();
    renderDay({ onOpenStep });

    fireEvent.press(screen.getByTestId("a-step-reflect"));

    expect(onOpenStep).toHaveBeenCalledWith("reflect");
  });

  it("opens the Quick Check", () => {
    const onOpenStep = jest.fn();
    renderDay({ onOpenStep, quickCheck: quickCheck("current") });

    fireEvent.press(screen.getByTestId("a-step-quickCheck"));

    expect(onOpenStep).toHaveBeenCalledWith("quickCheck");
  });
});
