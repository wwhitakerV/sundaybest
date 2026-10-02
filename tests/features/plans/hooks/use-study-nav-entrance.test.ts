import { act, renderHook } from "@testing-library/react-native";

import { useStudyNavEntrance } from "@/features/plans/hooks/use-study-nav-entrance";

// jest.setup mocks this module as `{ default: { vibrate } }`, which is how
// react-native itself reads it.
const { default: Vibration } = jest.requireMock<{ default: { vibrate: jest.Mock } }>(
  "react-native/Libraries/Vibration/Vibration",
);

beforeEach(() => {
  jest.useFakeTimers();
  Vibration.vibrate.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useStudyNavEntrance", () => {
  it("shows its sparks without buzzing the phone", () => {
    const { result } = renderHook(() => useStudyNavEntrance());
    let sawSparks = false;

    // Step through the spark's whole life, noting whether it ever showed.
    for (let elapsed = 0; elapsed < 1000; elapsed += 50) {
      act(() => {
        jest.advanceTimersByTime(50);
      });
      sawSparks ||= result.current.showSparks;
    }

    expect(sawSparks).toBe(true);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });
});
