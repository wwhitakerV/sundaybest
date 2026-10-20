import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { useMinuteClock } from "@/features/status-bar/hooks/use-minute-clock";

describe("useMinuteClock", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts at the time it is now", () => {
    jest.useFakeTimers({ now: new Date("2026-10-19T13:03:40") });

    const { result } = renderHook(() => useMinuteClock());

    expect(result.current.getMinutes()).toBe(3);
  });

  it("turns over on the minute, not a moment later", () => {
    jest.useFakeTimers({ now: new Date("2026-10-19T13:03:40") });
    const { result } = renderHook(() => useMinuteClock());

    act(() => jest.advanceTimersByTime(19_000));
    expect(result.current.getMinutes()).toBe(3);

    act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.getMinutes()).toBe(4);
  });

  it("keeps turning over, minute after minute", () => {
    jest.useFakeTimers({ now: new Date("2026-10-19T13:03:40") });
    const { result } = renderHook(() => useMinuteClock());

    act(() => jest.advanceTimersByTime(20_000 + 60_000 * 2));

    expect(result.current.getMinutes()).toBe(6);
  });

  it("catches up when the app comes back to the front", () => {
    jest.useFakeTimers({ now: new Date("2026-10-19T13:03:40") });
    let onChange: (state: AppStateStatus) => void = () => undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      onChange = listener;
      return { remove: jest.fn() };
    });
    const { result } = renderHook(() => useMinuteClock());

    // The phone slept: its clock moved on while no timer ran.
    jest.setSystemTime(new Date("2026-10-19T15:20:10"));
    act(() => onChange("active"));

    expect(result.current.getHours()).toBe(15);
    expect(result.current.getMinutes()).toBe(20);
  });
});
