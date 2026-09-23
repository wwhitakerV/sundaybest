import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { StudyScreen } from "@/features/plans/screens/StudyScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "2" });
});

describe("StudyScreen", () => {
  it("is addressable as study-screen", () => {
    render(<StudyScreen />);

    expect(screen.getByTestId("study-screen")).toBeVisible();
  });

  it("shows the day context in the header", () => {
    render(<StudyScreen />);

    expect(screen.getByText("Day 2 of 3")).toBeVisible();
  });

  it("starts on the Read step", () => {
    render(<StudyScreen />);

    expect(screen.getByTestId("study-read-body")).toBeVisible();
  });

  it("keeps the header mounted across a step change", () => {
    render(<StudyScreen />);

    const header = screen.getByTestId("study");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(screen.getByTestId("study")).toBe(header);
  });

  it("keeps the nav mounted across a step change", () => {
    render(<StudyScreen />);

    const nav = screen.getByTestId("study-nav");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(screen.getByTestId("study-nav")).toBe(nav);
  });

  it("advances to Scripture when Next is pressed", async () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(await screen.findByTestId("study-scripture-body")).toBeVisible();
    expect(screen.queryByTestId("study-read-body")).toBeNull();
  });

  it("advances through Reflect", async () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(await screen.findByTestId("study-reflect-body")).toBeVisible();
  });

  it("shows Finish on the Pray step", async () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(await screen.findByTestId("study-pray-body")).toBeVisible();
    // Inside StudyNav, which Jest's Reanimated mock leaves at its opacity-0
    // opening frame — assert presence, not visibility.
    expect(screen.getByText("Finish")).toBeOnTheScreen();
  });

  it("goes back a step when Previous is pressed after Scripture", async () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");

    fireEvent.press(screen.getByTestId("study-nav-prev-button"));

    expect(await screen.findByTestId("study-read-body")).toBeVisible();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("exits to Plan Overview when Previous is pressed on Read", () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-prev-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("navigates to Day Complete when Finish is pressed on Pray", async () => {
    render(<StudyScreen />);

    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-scripture-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-reflect-body");
    fireEvent.press(screen.getByTestId("study-nav-next-button"));
    await screen.findByTestId("study-pray-body");

    fireEvent.press(screen.getByTestId("study-nav-next-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/day-complete",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "2" }),
      }),
    );
  });
});
