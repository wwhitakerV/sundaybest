import { render, screen, fireEvent, waitFor } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanReadyScreen } from "./PlanReadyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
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
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/(tabs)/plans/[planId]/study",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
          params: expect.objectContaining({ day: "1" }),
        }),
      );
    });
  });

  it("dismisses the flow to Home when Not now is pressed", () => {
    render(<PlanReadyScreen />);

    fireEvent.press(screen.getByTestId("plan-ready-not-now-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/home");
  });
});
