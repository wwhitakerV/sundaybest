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

const ACTIVE = "plan-choose-whom-you-will-serve";
const GRATITUDE = "plan-give-thanks";
const STORM = "plan-faith-through-the-storm";
const REST = "plan-come-to-me-and-rest";

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

  it("shows the filter tabs", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-tabs")).toBeVisible();
    for (const label of ["All", "In progress", "Done", "Saved"]) {
      expect(screen.getByTestId(`plans-filter-tabs-option-${label}`)).toBeVisible();
    }
  });

  it("counts each filter's plans", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-tabs-option-All")).toHaveTextContent("All4");
    expect(screen.getByTestId("plans-filter-tabs-option-In progress")).toHaveTextContent(
      "In progress1",
    );
    expect(screen.getByTestId("plans-filter-tabs-option-Done")).toHaveTextContent("Done1");
    expect(screen.getByTestId("plans-filter-tabs-option-Saved")).toHaveTextContent("Saved2");
  });

  it("lists every plan under All", () => {
    render(<PlansScreen />);

    const ids = screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID));

    expect([...ids].sort()).toEqual(
      [ACTIVE, STORM, REST, GRATITUDE].map((id) => `plans-item-${id}`).sort(),
    );
  });

  it("shows only the plans a filter holds", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId("plans-filter-tabs-option-Done"));
    expect(screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID))).toEqual([
      `plans-item-${GRATITUDE}`,
    ]);

    fireEvent.press(screen.getByTestId("plans-filter-tabs-option-Saved"));
    expect(screen.getAllByTestId(/^plans-item-/).map((item) => String(item.props.testID))).toEqual([
      `plans-item-${REST}`,
      `plans-item-${GRATITUDE}`,
    ]);

    fireEvent.press(screen.getByTestId("plans-filter-tabs-option-In progress"));
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
    expect(card).toHaveTextContent(/Continue/);
  });

  it("shows a finished plan as done, with when it finished", () => {
    render(<PlansScreen />);

    const card = screen.getByTestId(`plans-item-${GRATITUDE}`);
    expect(card).toHaveTextContent(/Done/);
    expect(card).toHaveTextContent(/Finished Sep 5/);
  });

  it("opens the plan pressed", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId(`plans-item-${GRATITUDE}`));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: GRATITUDE }),
      }),
    );
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
