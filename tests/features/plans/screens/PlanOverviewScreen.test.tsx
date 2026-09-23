import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanOverviewScreen } from "@/features/plans/screens/PlanOverviewScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanOverviewScreen", () => {
  it("is addressable as plan-overview-screen", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day" });
    render(<PlanOverviewScreen />);

    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("shows the plan's title", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day" });
    render(<PlanOverviewScreen />);

    expect(screen.getByText("Faith Through the Storm")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day" });
    render(<PlanOverviewScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Read for the plan's current day when Continue is pressed", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day" });
    render(<PlanOverviewScreen />);

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/study/[planId]",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "2" }),
      }),
    );
  });

  it("goes back when the back action is pressed", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day" });
    render(<PlanOverviewScreen />);

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
