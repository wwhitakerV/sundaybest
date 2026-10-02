import { act, renderHook } from "@testing-library/react-native";

import { usePresence } from "@/hooks/use-presence";

// Rendered without `@tests/helpers/render` on purpose: that helper loads Expo
// Router's testing library, which swaps in Reanimated's mock — where every
// animation ends at once, so a sheet's exit could never be seen under way.

function renderPresence(visible: boolean) {
  return renderHook(({ shown }: { shown: boolean }) => usePresence(shown), {
    initialProps: { shown: visible },
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

describe("usePresence", () => {
  it("is mounted from the start when it starts shown", () => {
    const { result } = renderPresence(true);

    expect(result.current.mounted).toBe(true);
  });

  it("is not mounted when it starts hidden", () => {
    const { result } = renderPresence(false);

    expect(result.current.mounted).toBe(false);
  });

  it("mounts the moment it's shown", () => {
    const { result, rerender } = renderPresence(false);

    rerender({ shown: true });

    expect(result.current.mounted).toBe(true);
  });

  it("stays mounted right after it's hidden, while it leaves", () => {
    const { result, rerender } = renderPresence(true);

    rerender({ shown: false });

    expect(result.current.mounted).toBe(true);
  });

  it("unmounts once it has left", () => {
    const { result, rerender } = renderPresence(true);

    rerender({ shown: false });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.mounted).toBe(false);
  });

  it("never unmounts, not for a render, when shown again before it has left", () => {
    const history: boolean[] = [];
    const { rerender } = renderHook(
      ({ shown }: { shown: boolean }) => {
        const presence = usePresence(shown);
        history.push(presence.mounted);
        return presence;
      },
      { initialProps: { shown: true } },
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender({ shown: false });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ shown: true });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(history).not.toContain(false);
  });

  it("stays mounted when shown again before it has left", () => {
    const { result, rerender } = renderPresence(true);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender({ shown: false });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({ shown: true });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.mounted).toBe(true);
  });
});
