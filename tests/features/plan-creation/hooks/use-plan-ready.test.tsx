import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import {
  AppStoreProvider,
  INITIAL_STATE,
  appReducer,
  getPlanById,
  getReminder,
  useAppSelector,
} from "@/core/store";
import { usePlanReady } from "@/features/plan-creation/hooks/use-plan-ready";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitModal = jest.fn<void, []>();
// A ready plan in the mock data: three days, not started.
const PLAN_ID = "plan-still-praying";

/** A store whose daily study reminder is off, so turning it on is observable. */
const REMINDER_OFF = appReducer(INITIAL_STATE, {
  type: "settings/reminderEnabled",
  reminderId: "reminder-daily-study",
  enabled: false,
  at: "2026-09-23T12:00:00.000Z",
});

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider initialState={REMINDER_OFF}>{children}</AppStoreProvider>;
}

function renderReady(params: Record<string, string> = { planId: PLAN_ID }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  return renderHook(
    () => ({
      ready: usePlanReady(),
      reminder: useAppSelector((state) => getReminder(state, "dailyStudy")),
      status: useAppSelector((state) => getPlanById(state, PLAN_ID)?.status),
    }),
    { wrapper },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    navigate: mockNavigate,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanReady", () => {
  it("hands back the plan it's for", () => {
    const { result } = renderReady();

    expect(result.current.ready.plan).toMatchObject({ id: PLAN_ID, title: "Still Praying" });
  });

  it("hands back no plan when opened without one", () => {
    const { result } = renderReady({});

    expect(result.current.ready.plan).toBeNull();
  });

  it("turns the reminder on at the time picked", () => {
    const { result } = renderReady();
    expect(result.current.reminder).toMatchObject({ enabled: false });

    act(() => result.current.ready.selectTime("07:00"));

    expect(result.current.reminder).toMatchObject({ enabled: true, time: "07:00" });
  });

  it("starts the plan and opens its day 1 on start()", async () => {
    const { result } = renderReady();

    await act(async () => {
      await Promise.resolve(result.current.ready.start());
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/study/[planId]",
        params: { planId: PLAN_ID, day: "1" },
      });
    });
    expect(result.current.status).toBe("active");
  });

  it("starts the sample plan's study on start() with no plan", async () => {
    const { result } = renderReady({});

    await act(async () => {
      await Promise.resolve(result.current.ready.start());
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/study/[planId]",
        params: { planId: SAMPLE_PLAN_ID, day: "1" },
      });
    });
  });

  it("leaves the flow for Home on notNow()", () => {
    const { result } = renderReady();

    act(() => result.current.ready.notNow());

    expect(mockExitModal).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/home");
  });
});

describe("usePlanReady haptics", () => {
  it("selects once when the reminder is off and its own time is picked, turning it on", () => {
    const { result } = renderReady();

    act(() => result.current.ready.selectTime("06:30"));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing on Start when there's neither a plan nor a sample to start", async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    const noSample = {
      ...INITIAL_STATE,
      plans: Object.fromEntries(
        Object.entries(INITIAL_STATE.plans).filter(([, plan]) => !plan.isSample),
      ),
    };
    const { result } = renderHook(() => usePlanReady(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AppStoreProvider initialState={noSample}>{children}</AppStoreProvider>
      ),
    });

    await act(async () => {
      await result.current.start();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("selects once when a different reminder time is picked", () => {
    const { result } = renderReady();

    act(() => result.current.ready.selectTime("07:00"));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the reminder's current time is picked again", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: PLAN_ID });
    const onWrapper = ({ children }: { children: ReactNode }) => (
      <AppStoreProvider>{children}</AppStoreProvider>
    );
    // The mock data's daily reminder is on, at 06:30.
    const { result } = renderHook(() => usePlanReady(), { wrapper: onWrapper });

    act(() => result.current.selectTime("06:30"));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("taps as Start begins the plan", async () => {
    const { result } = renderReady();

    await act(async () => {
      await Promise.resolve(result.current.ready.start());
    });

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});
