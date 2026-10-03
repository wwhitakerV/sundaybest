import { act, renderHook } from "@testing-library/react-native";

import { useStoryPhase } from "@/features/welcome/hooks/use-story-phase";
import type { StoryBeat } from "@/features/welcome/logic/story";

const BEATS: readonly StoryBeat[] = [
  { phase: { kind: "arrive" }, holdMs: 100 },
  { phase: { kind: "focus", card: "paste" }, holdMs: 100 },
  { phase: { kind: "leave" }, holdMs: 100 },
];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useStoryPhase", () => {
  it("holds the current phase while frozen, instead of resetting or advancing", () => {
    const { result, rerender } = renderHook(
      ({ frozen }: { frozen: boolean }) => useStoryPhase(BEATS, false, frozen),
      { initialProps: { frozen: false } },
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ kind: "focus", card: "paste" });

    rerender({ frozen: true });
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(result.current).toEqual({ kind: "focus", card: "paste" });
  });
});
