import { act, renderHook } from "@testing-library/react-native";

import { useLiftAnchors } from "@/features/welcome/hooks/use-lift-anchors";

const rect = { x: 1, y: 2, width: 3, height: 4 };

describe("useLiftAnchors", () => {
  it("starts with no anchors", () => {
    const { result } = renderHook(() => useLiftAnchors());

    expect(result.current.anchors.size).toBe(0);
  });

  it("records the rect an anchor reports", () => {
    const { result } = renderHook(() => useLiftAnchors());

    act(() => result.current.onAnchor("plan:0", rect));

    expect(result.current.anchors.get("plan:0")).toEqual(rect);
  });

  it("keeps the same map when the same rect is reported again", () => {
    const { result } = renderHook(() => useLiftAnchors());
    act(() => result.current.onAnchor("plan:0", rect));
    const before = result.current.anchors;

    act(() => result.current.onAnchor("plan:0", { ...rect }));

    expect(result.current.anchors).toBe(before);
  });

  it("gives a new map with the new rect when the rect changes", () => {
    const { result } = renderHook(() => useLiftAnchors());
    act(() => result.current.onAnchor("plan:0", rect));
    const before = result.current.anchors;

    act(() => result.current.onAnchor("plan:0", { ...rect, y: 99 }));

    expect(result.current.anchors).not.toBe(before);
    expect(result.current.anchors.get("plan:0")).toEqual({ ...rect, y: 99 });
    expect(before.get("plan:0")).toEqual(rect);
  });

  it("keeps onAnchor stable across renders", () => {
    const { result } = renderHook(() => useLiftAnchors());
    const first = result.current.onAnchor;

    act(() => result.current.onAnchor("plan:0", rect));

    expect(result.current.onAnchor).toBe(first);
  });
});
