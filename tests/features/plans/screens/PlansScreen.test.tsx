import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { Pressable } from "react-native";

import {
  AppStoreProvider,
  INITIAL_STATE,
  getCurrentPlanDay,
  getSermonForPlan,
  useStoreActions,
} from "@/core/store";
import { studyHref } from "@/entities/plan";
import { PlansScreen } from "@/features/plans/screens/PlansScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

const ACTIVE = "plan-today-i-choose-to-be-a-blessing";
const NEGATIVE_THINKING = "plan-break-the-cycle-of-negative-thinking";
const STILL_PRAYING = "plan-still-praying";
const TEMPTATION = "plan-overcome-temptation";

/** A stand-in for finishing a day elsewhere in the app, beside the screen. */
function FinishDay({ dayId }: { dayId: string }) {
  const { finishPlanDay } = useStoreActions();
  return <Pressable testID="finish-day" onPress={() => finishPlanDay(dayId, null)} />;
}

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("PlansScreen", () => {
  it("is addressable as plans-screen", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<PlansScreen />);

    expect(screen.getByText("Plans")).toBeVisible();
  });

  it("shows the filters as pills", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-pills")).toBeVisible();
    for (const label of ["All", "In progress", "Done", "Saved"]) {
      expect(screen.getByTestId(`plans-filter-pills-option-${label}`)).toBeVisible();
    }
  });

  it("counts each filter's plans", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-pills-option-All")).toHaveTextContent("All4");
    expect(screen.getByTestId("plans-filter-pills-option-In progress")).toHaveTextContent(
      "In progress1",
    );
    expect(screen.getByTestId("plans-filter-pills-option-Done")).toHaveTextContent("Done1");
    expect(screen.getByTestId("plans-filter-pills-option-Saved")).toHaveTextContent("Saved2");
  });

  it("marks the filter picked as selected", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-pills-option-All")).toBeSelected();

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Done"));

    expect(screen.getByTestId("plans-filter-pills-option-Done")).toBeSelected();
    expect(screen.getByTestId("plans-filter-pills-option-All")).not.toBeSelected();
  });

  it("lists every plan under All", () => {
    render(<PlansScreen />);

    const ids = screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID));

    expect([...ids].sort()).toEqual(
      [ACTIVE, STILL_PRAYING, TEMPTATION, NEGATIVE_THINKING].map((id) => `plans-item-${id}`).sort(),
    );
  });

  it("shows only the plans a filter holds", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Done"));
    expect(screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID))).toEqual([
      `plans-item-${NEGATIVE_THINKING}`,
    ]);

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Saved"));
    expect(screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID))).toEqual([
      `plans-item-${TEMPTATION}`,
      `plans-item-${NEGATIVE_THINKING}`,
    ]);

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-In progress"));
    expect(screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID))).toEqual([
      `plans-item-${ACTIVE}`,
    ]);
  });

  it("shows a plan under way with the day it's on", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${ACTIVE}`);
    expect(card).not.toHaveTextContent(/In progress/);
    expect(card).toHaveTextContent(/Today I Choose to Be a Blessing/);
    expect(card).toHaveTextContent(/Day 2 of 6/);
  });

  it("shows a plan not started with how long it runs", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${STILL_PRAYING}`);
    expect(card).toHaveTextContent(/Still Praying/);
    expect(card).toHaveTextContent(/3 days/);
    expect(card).not.toHaveTextContent(/Not started/);
  });

  it("shows a finished plan as done, with when it finished", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${NEGATIVE_THINKING}`);
    expect(card).toHaveTextContent(/Finished Sep 5/);
    expect(screen.getByTestId(`plans-progress-${NEGATIVE_THINKING}-flame`)).toBeOnTheScreen();
  });

  it("opens the plan pressed", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId(`plans-item-${NEGATIVE_THINKING}`));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: NEGATIVE_THINKING }),
      }),
    );
  });

  it("gives each plan the page's full width, one to a row", () => {
    render(<PlansScreen />);

    for (const card of screen.getAllByTestId(/^plans-item-/)) {
      expect(card).toHaveStyle({ width: "100%" });
    }
  });

  it("shows each plan's thumbnail at 16:9", () => {
    render(<PlansScreen />);

    for (const id of [ACTIVE, NEGATIVE_THINKING, STILL_PRAYING, TEMPTATION]) {
      expect(screen.getByTestId(`plans-thumbnail-${id}`)).toHaveStyle({
        aspectRatio: 16 / 9,
      });
    }
  });

  it("shows Continue on a plan in progress, opening its study at the current day", () => {
    const day = getCurrentPlanDay(INITIAL_STATE, ACTIVE)?.dayNumber;
    render(<PlansScreen />);

    expect(screen.getByTestId(`plans-action-${ACTIVE}`)).toHaveTextContent("Continue");
    fireEvent.press(screen.getByTestId(`plans-action-${ACTIVE}`));

    expect(day).toBeDefined();
    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE, day ?? 0));
  });

  it("shows Start on a plan not started, opening its first day", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId(`plans-action-${STILL_PRAYING}`)).toHaveTextContent("Start");
    fireEvent.press(screen.getByTestId(`plans-action-${STILL_PRAYING}`));

    expect(mockPush).toHaveBeenCalledWith(studyHref(STILL_PRAYING, 1));
  });

  it("shows no action on a finished plan", () => {
    render(<PlansScreen />);

    expect(screen.queryByTestId(`plans-action-${NEGATIVE_THINKING}`)).toBeNull();
  });

  it("names each plan's church under its title", () => {
    const church = getSermonForPlan(INITIAL_STATE, ACTIVE)?.church;
    render(<PlansScreen />);

    expect(church).toBeTruthy();
    expect(
      within(screen.getByTestId(`plans-item-${ACTIVE}`)).getByText(church ?? "?"),
    ).toBeOnTheScreen();
  });

  it("spaces the plans as separate cards, with no line between them", () => {
    render(<PlansScreen />);

    expect(screen.queryAllByTestId("plans-divider")).toHaveLength(0);
  });

  it("shows a plan's progress moving as soon as a day of it is finished", () => {
    render(
      <>
        <PlansScreen />
        <FinishDay dayId={`${ACTIVE}-day-2`} />
      </>,
    );

    fireEvent.press(screen.getByTestId("finish-day"));

    expect(screen.getByTestId(`plans-item-${ACTIVE}`)).toHaveTextContent(/Day 3 of 6/);
  });

  it("says so when the filter picked holds no plans", () => {
    render(
      <AppStoreProvider initialState={{ ...INITIAL_STATE, library: {} }}>
        <PlansScreen />
      </AppStoreProvider>,
    );

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Saved"));

    const empty = screen.getByTestId("plans-empty");
    expect(within(empty).getByText("Nothing saved yet")).toBeOnTheScreen();
    expect(
      within(empty).getByText("Save a plan from its More menu to keep it here."),
    ).toBeOnTheScreen();
    expect(screen.queryAllByTestId(/^plans-item-/)).toHaveLength(0);
  });

  it("shows no empty state while the filter holds plans", () => {
    render(<PlansScreen />);

    expect(screen.queryByTestId("plans-empty")).toBeNull();
  });

  it("shows each plan with a progress dial at its percent", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId(`plans-progress-${ACTIVE}`)).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ now: 17 }),
    );
  });
});
