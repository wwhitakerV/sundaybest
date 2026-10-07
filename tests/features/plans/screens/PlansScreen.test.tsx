import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { planOverviewHref, studyHref } from "@/entities/plan";
import { PlansScreen } from "@/features/plans/screens/PlansScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const ART = "https://images.example.com/sermon.jpg";

/** Six days, day 1 done, day 2 today. */
const ACTIVE = aPlan({
  seed: 1,
  title: "Today I Choose to Be a Blessing",
  church: "VOUS Church",
  lengthDays: 6,
  completedDays: 1,
  thumbnailUrl: ART,
  createdAt: "2026-10-04T12:00:00.000Z",
});
/** Three days, not started. */
const STILL_PRAYING = aPlan({
  seed: 2,
  title: "Still Praying",
  status: "ready",
  lengthDays: 3,
  thumbnailUrl: ART,
  createdAt: "2026-10-03T12:00:00.000Z",
});
/** Not started, kept in Saved. */
const TEMPTATION = aPlan({
  seed: 3,
  title: "Overcome Temptation",
  status: "ready",
  lengthDays: 1,
  saved: true,
  thumbnailUrl: ART,
  createdAt: "2026-10-02T12:00:00.000Z",
});
/** Finished, and kept in Saved. */
const NEGATIVE_THINKING = aPlan({
  seed: 4,
  title: "Break the Cycle of Negative Thinking",
  status: "completed",
  lengthDays: 7,
  saved: true,
  thumbnailUrl: ART,
  createdAt: "2026-10-01T12:00:00.000Z",
});
const ALL = [ACTIVE, STILL_PRAYING, TEMPTATION, NEGATIVE_THINKING];

/** Plans, once these plans have arrived. */
async function openPlans(plans: Parameters<typeof servePlans>[0] = ALL) {
  const seen = servePlans(plans);
  render(<PlansScreen />);
  await waitFor(() => expect(screen.queryByTestId("plans-content-pending")).toBeNull(), {
    timeout: 10000,
  });
  return seen;
}

/** A plan card's own ID — not its panel's or words' (`plans-item-<id>-panel`). */
const CARD = /^plans-item-[0-9a-f-]{36}$/;

/** The plans listed, by test ID, in order. */
const listed = () => screen.getAllByTestId(CARD).map((item) => String(item.props.testID));

/** Fires a card's own action (Continue or Start), as VoiceOver offers it. */
function activateCardAction(planId: string) {
  fireEvent(screen.getByTestId(`plans-item-${planId}`), "accessibilityAction", {
    nativeEvent: { actionName: "activate-action" },
  });
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("PlansScreen", () => {
  it("is addressable as plans-screen", () => {
    servePlans(ALL);
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-screen")).toBeVisible();
  });

  it("shows the title", () => {
    servePlans(ALL);
    render(<PlansScreen />);

    expect(screen.getByText("Plans")).toBeVisible();
  });

  it("shows its plans' shape while they're on their way", () => {
    servePlans(ALL);
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-content-pending")).toBeOnTheScreen();
  });

  it("shows the filters as pills", async () => {
    await openPlans();

    expect(screen.getByTestId("plans-filter-pills")).toBeVisible();
    for (const label of ["All", "In progress", "Done", "Saved"]) {
      expect(screen.getByTestId(`plans-filter-pills-option-${label}`)).toBeVisible();
    }
  });

  it("counts each filter's plans", async () => {
    await openPlans();

    expect(screen.getByTestId("plans-filter-pills-option-All")).toHaveTextContent("All4");
    expect(screen.getByTestId("plans-filter-pills-option-In progress")).toHaveTextContent(
      "In progress1",
    );
    expect(screen.getByTestId("plans-filter-pills-option-Done")).toHaveTextContent("Done1");
    expect(screen.getByTestId("plans-filter-pills-option-Saved")).toHaveTextContent("Saved2");
  });

  it("marks the filter picked as selected", async () => {
    await openPlans();

    expect(screen.getByTestId("plans-filter-pills-option-All")).toBeSelected();

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Done"));

    expect(screen.getByTestId("plans-filter-pills-option-Done")).toBeSelected();
    expect(screen.getByTestId("plans-filter-pills-option-All")).not.toBeSelected();
  });

  it("lists every plan under All, newest first", async () => {
    await openPlans();

    expect(listed()).toEqual(ALL.map(({ id }) => `plans-item-${id}`));
  });

  it("shows only the plans a filter holds", async () => {
    await openPlans();

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Done"));
    expect(listed()).toEqual([`plans-item-${NEGATIVE_THINKING.id}`]);

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Saved"));
    expect([...listed()].sort()).toEqual(
      [`plans-item-${TEMPTATION.id}`, `plans-item-${NEGATIVE_THINKING.id}`].sort(),
    );

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-In progress"));
    expect(listed()).toEqual([`plans-item-${ACTIVE.id}`]);
  });

  it("shows a plan under way with the day it's on", async () => {
    await openPlans();

    const card = screen.getByTestId(`plans-item-${ACTIVE.id}`);
    expect(card).not.toHaveTextContent(/In progress/);
    expect(card).toHaveTextContent(/Today I Choose to Be a Blessing/);
    expect(card).toHaveTextContent(/Day 2 of 6/);
  });

  it("shows a plan not started with how long it runs", async () => {
    await openPlans();

    const card = screen.getByTestId(`plans-item-${STILL_PRAYING.id}`);
    expect(card).toHaveTextContent(/Still Praying/);
    expect(card).toHaveTextContent(/3 days/);
    expect(card).not.toHaveTextContent(/Not started/);
  });

  it("shows a finished plan as done, with when it finished, its ring closed", async () => {
    await openPlans();

    expect(screen.getByTestId(`plans-item-${NEGATIVE_THINKING.id}`)).toHaveTextContent(
      /Finished Oct 5/,
    );
    expect(screen.getByTestId(`plans-progress-${NEGATIVE_THINKING.id}`)).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 100 }),
    );
  });

  it("opens the plan pressed", async () => {
    await openPlans();

    fireEvent.press(screen.getByTestId(`plans-item-${NEGATIVE_THINKING.id}`));

    expect(mockPush).toHaveBeenCalledWith(planOverviewHref(NEGATIVE_THINKING.id));
  });

  it("gives each plan the page's full width, one to a row", async () => {
    await openPlans();

    for (const card of screen.getAllByTestId(CARD)) {
      expect(card).toHaveStyle({ width: "100%" });
    }
  });

  it("shows each plan's artwork at 16:9", async () => {
    await openPlans();

    for (const { id } of ALL) {
      expect(screen.getByTestId(`plans-thumbnail-${id}`)).toHaveStyle({ aspectRatio: 16 / 9 });
    }
  });

  it("offers Continue on a plan in progress, opening its study at the current day", async () => {
    await openPlans();

    expect(screen.getByTestId(`plans-item-${ACTIVE.id}`)).toHaveProp("accessibilityActions", [
      { name: "activate-action", label: "Continue" },
    ]);
    activateCardAction(ACTIVE.id);

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2));
  });

  it("offers Start on a plan not started, opening its first day once started", async () => {
    const seen = await openPlans();

    expect(screen.getByTestId(`plans-item-${STILL_PRAYING.id}`)).toHaveProp(
      "accessibilityActions",
      [{ name: "activate-action", label: "Start" }],
    );
    activateCardAction(STILL_PRAYING.id);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(studyHref(STILL_PRAYING.id, 1)));
    expect(seen).toContainEqual(
      expect.objectContaining({ method: "POST", path: `/v1/plans/${STILL_PRAYING.id}/start` }),
    );
  });

  it("shows no action on a finished plan", async () => {
    await openPlans();

    expect(screen.getByTestId(`plans-item-${NEGATIVE_THINKING.id}`)).not.toHaveProp(
      "accessibilityActions",
    );
  });

  it("names each plan's church under its title", async () => {
    await openPlans();

    expect(
      within(screen.getByTestId(`plans-item-${ACTIVE.id}`)).getByText("VOUS Church"),
    ).toBeOnTheScreen();
  });

  it("spaces the plans as separate cards, with no line between them", async () => {
    await openPlans();

    expect(screen.queryAllByTestId("plans-divider")).toHaveLength(0);
  });

  it("says so when the filter picked holds no plans", async () => {
    await openPlans([ACTIVE, STILL_PRAYING]);

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Saved"));

    const empty = screen.getByTestId("plans-empty");
    expect(within(empty).getByText("Nothing saved yet")).toBeOnTheScreen();
    expect(
      within(empty).getByText("Save a plan from its More menu to keep it here."),
    ).toBeOnTheScreen();
    expect(screen.queryAllByTestId(CARD)).toHaveLength(0);
  });

  it("shows no empty state while the filter holds plans", async () => {
    await openPlans();

    expect(screen.queryByTestId("plans-empty")).toBeNull();
  });

  it("shows each plan with a progress ring at its percent", async () => {
    await openPlans();

    expect(screen.getByTestId(`plans-progress-${ACTIVE.id}`)).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 17 }),
    );
  });
});
