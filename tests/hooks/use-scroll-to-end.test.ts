import { renderHook } from "@testing-library/react-native";
import { act } from "react";

import { useScrollToEnd } from "@/hooks/use-scroll-to-end";

function fakeScroller() {
  return { current: { scrollToEnd: jest.fn() } };
}

describe("useScrollToEnd", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("scrolls all the way down, animated, once the trigger is set and laid out", () => {
    const scroller = fakeScroller();
    renderHook(() => useScrollToEnd(scroller, 180));

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(scroller.current.scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it("stays where it is without a trigger", () => {
    const scroller = fakeScroller();
    renderHook(() => useScrollToEnd(scroller, null));

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(scroller.current.scrollToEnd).not.toHaveBeenCalled();
  });

  it("scrolls down again when the room at the foot grows", () => {
    const scroller = fakeScroller();
    const { rerender } = renderHook(({ trigger }) => useScrollToEnd(scroller, trigger), {
      initialProps: { trigger: 180 },
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    rerender({ trigger: 240 });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(scroller.current.scrollToEnd).toHaveBeenCalledTimes(2);
  });
});
