import { act, renderHook } from "@testing-library/react-native";

import { useSceneClock } from "@/features/welcome/hooks/use-scene-clock";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useSceneClock", () => {
  it("holds its reading where it is while frozen", () => {
    const { result, rerender } = renderHook(
      ({ frozen }: { frozen: boolean }) => useSceneClock("a", 0, frozen),
      { initialProps: { frozen: false } },
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });
    const before = result.current;
    expect(before).toBeGreaterThan(0);

    rerender({ frozen: true });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(before);
  });
});
