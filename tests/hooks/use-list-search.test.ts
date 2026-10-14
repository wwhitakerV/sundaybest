import { act, renderHook } from "@tests/helpers/render";

import { useListSearch } from "@/hooks/use-list-search";

describe("useListSearch", () => {
  it("opens with nothing typed", () => {
    const { result } = renderHook(() => useListSearch());

    act(() => result.current.open());

    expect(result.current.searching).toBe(true);
    expect(result.current.words).toBe("");
  });

  it("tells whoever opens it, for its haptic", () => {
    const onOpen = jest.fn();
    const { result } = renderHook(() => useListSearch({ onOpen }));

    act(() => result.current.open());

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("searches for what's typed", () => {
    const { result } = renderHook(() => useListSearch());

    act(() => result.current.open());
    act(() => result.current.setWords("grace"));

    expect(result.current.words).toBe("grace");
    expect(result.current.query).toBe("grace");
  });

  it("closes from its own X: the words cleared, the field gone", () => {
    const { result } = renderHook(() => useListSearch());

    act(() => result.current.open());
    act(() => result.current.setWords("grace"));
    act(() => result.current.close());

    expect(result.current.searching).toBe(false);
    expect(result.current.words).toBe("");
    expect(result.current.query).toBe("");
  });

  it("closes when the keyboard's put away with nothing typed", () => {
    const { result } = renderHook(() => useListSearch());

    act(() => result.current.open());
    act(() => result.current.setWords("  "));
    act(() => result.current.leave());

    expect(result.current.searching).toBe(false);
  });

  it("stays open, its words kept, when the keyboard's put away with something typed", () => {
    const { result } = renderHook(() => useListSearch());

    act(() => result.current.open());
    act(() => result.current.setWords("grace"));
    act(() => result.current.leave());

    expect(result.current.searching).toBe(true);
    expect(result.current.words).toBe("grace");
  });
});
