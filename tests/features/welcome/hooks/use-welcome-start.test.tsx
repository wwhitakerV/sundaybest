import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import { tapFeedback } from "@/core/haptics/haptics";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { useWelcomeStart } from "@/features/welcome/hooks/use-welcome-start";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));

/** One animation frame, with room to spare. */
const FRAME_MS = 32;

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

/** A store with only the sample plan in it — nothing of the user's own. */
const NO_PLANS: AppState = {
  ...INITIAL_STATE,
  plans: Object.fromEntries(
    Object.entries(INITIAL_STATE.plans).filter(([, plan]) => plan.isSample),
  ),
};

function renderStart(state: AppState = INITIAL_STATE) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStoreProvider initialState={state}>{children}</AppStoreProvider>
  );
  return renderHook(() => useWelcomeStart(), { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  mockPush.mockClear();
  jest.mocked(tapFeedback).mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useWelcomeStart", () => {
  it("goes to Home, then New Plan, on start() with no plans", () => {
    const { result } = renderStart(NO_PLANS);

    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(plan-creation)/paste-sermon"]]);
  });

  it("goes to Home only on start() with plans", () => {
    const { result } = renderStart();

    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]);
  });

  it("buzzes on start()", () => {
    const { result } = renderStart();

    act(() => result.current.start());

    expect(tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("opens the sample plan's overview on seeSample()", () => {
    const { result } = renderStart();

    act(() => result.current.seeSample());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: SAMPLE_PLAN_ID },
    });
  });
});

describe("useWelcomeStart's wait", () => {
  it("is not starting at first", () => {
    const { result } = renderStart();

    expect(result.current.starting).toBe(false);
  });

  it("is starting at once on start()", () => {
    const { result } = renderStart();

    act(() => result.current.start());

    expect(result.current.starting).toBe(true);
  });

  it("holds its routes back until the next frame, so the spinner can draw", () => {
    const { result } = renderStart();

    act(() => result.current.start());
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("ignores a second start() while starting", () => {
    const { result } = renderStart();

    act(() => result.current.start());
    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]);
  });

  it("stops starting when the screen loses focus", () => {
    const { result } = renderStart();
    act(() => result.current.start());
    expect(result.current.starting).toBe(true);

    const focusCallback = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
    let cleanup: unknown;
    act(() => {
      cleanup = focusCallback?.();
    });
    act(() => {
      if (typeof cleanup === "function") (cleanup as () => void)();
    });

    expect(result.current.starting).toBe(false);
  });

  it("doesn't move on if the screen is left before the frame comes", () => {
    const { result } = renderStart();
    act(() => result.current.start());
    const focusCallback = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
    let cleanup: unknown;
    act(() => {
      cleanup = focusCallback?.();
    });
    act(() => {
      if (typeof cleanup === "function") (cleanup as () => void)();
    });

    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("starts again once it's back on the screen after leaving it", () => {
    const { result } = renderStart();
    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });
    const focusCallback = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
    let cleanup: unknown;
    act(() => {
      cleanup = focusCallback?.();
    });
    act(() => {
      if (typeof cleanup === "function") (cleanup as () => void)();
    });

    act(() => result.current.start());
    act(() => {
      jest.advanceTimersByTime(FRAME_MS);
    });

    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(tabs)/home"]]);
  });
});
