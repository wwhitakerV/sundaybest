import { renderHook, waitFor } from "@tests/helpers/render";

import { useEarnedSearch } from "@/core/storage/search-shown-queries";
import { forgetShownSearches, markSearchShown, shownSearches } from "@tests/mocks/searches-shown";

jest.mock("@/core/storage/searches-shown", () =>
  jest.requireActual<object>("@tests/mocks/searches-shown"),
);

beforeEach(() => forgetShownSearches());

describe("useEarnedSearch", () => {
  it("offers search once the list reaches its threshold, and records that it has", async () => {
    const { result } = renderHook(() => useEarnedSearch("plans", 10, 10));

    expect(result.current).toBe(true);
    await waitFor(() => expect(shownSearches().has("plans")).toBe(true));
  });

  it("keeps offering search once it's been offered, though the list has shrunk", async () => {
    await markSearchShown("user-1", "weeks");

    const { result } = renderHook(() => useEarnedSearch("weeks", 2, 8));

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("offers none to a list shorter than its threshold that's never had one", async () => {
    await markSearchShown("user-1", "weeks");

    // Weeks' record read, so the other list's has been too.
    const { result } = renderHook(() => ({
      weeks: useEarnedSearch("weeks", 2, 8),
      plans: useEarnedSearch("plans", 9, 10),
    }));

    await waitFor(() => expect(result.current.weeks).toBe(true));
    expect(result.current.plans).toBe(false);
    expect(shownSearches().has("plans")).toBe(false);
  });
});
