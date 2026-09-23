import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanReadyScreen } from "@/features/plan-creation/screens/PlanReadyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanReadyScreen", () => {
  it("is addressable as plan-ready-screen", () => {
    render(<PlanReadyScreen />);

    expect(screen.getByTestId("plan-ready-screen")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PlanReadyScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Read for day 1 when Start day 1 is pressed", async () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-start-button"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/study/[planId]",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
          params: expect.objectContaining({ day: "1" }),
        }),
      );
    });
  });

  it("dismisses the flow to Home when Not now is pressed", () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-not-now-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/home");
  });
});
