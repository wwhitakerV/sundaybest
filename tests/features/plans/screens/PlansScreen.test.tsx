import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { Pressable } from "react-native";

import { useStoreActions } from "@/core/store";
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
  const { completePlanDay } = useStoreActions();
  return <Pressable testID="finish-day" onPress={() => completePlanDay(dayId)} />;
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

  it("shows the account icon", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId("plans-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
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

  it("fills the filter picked in the brand red", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-pills-option-All")).toHaveStyle({
      backgroundColor: "#D62626",
    });

    fireEvent.press(screen.getByTestId("plans-filter-pills-option-Done"));

    expect(screen.getByTestId("plans-filter-pills-option-Done")).toHaveStyle({
      backgroundColor: "#D62626",
    });
    expect(screen.getByTestId("plans-filter-pills-option-All")).toHaveStyle({
      backgroundColor: "#F7F1F1",
    });
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
    expect(card).toHaveTextContent(/In progress/);
    expect(card).toHaveTextContent(/Today I Choose to Be a Blessing/);
    expect(card).toHaveTextContent(/Day 2 of 6/);
  });

  it("shows a plan not started with how long it runs", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${STILL_PRAYING}`);
    expect(card).toHaveTextContent(/Still Praying/);
    expect(card).toHaveTextContent(/Not started · 3 days/);
  });

  it("shows a finished plan as done, with when it finished", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${NEGATIVE_THINKING}`);
    expect(card).toHaveTextContent(/Done/);
    expect(card).toHaveTextContent(/Finished Sep 5/);
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

  it("gives a plan no button of its own: the plan itself opens", () => {
    render(<PlansScreen />);

    expect(screen.queryByTestId(`plans-action-${ACTIVE}`)).toBeNull();
    expect(screen.queryByText("Continue")).toBeNull();
  });

  it("separates the plans with a thin line, with none after the last", () => {
    render(<PlansScreen />);

    const plans = screen.getAllByTestId(/^plans-item-/);
    expect(screen.getAllByTestId("plans-divider")).toHaveLength(plans.length - 1);
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
});
