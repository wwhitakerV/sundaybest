import { act, renderHook, waitFor } from "@tests/helpers/render";

import { useLikedVerse } from "@/core/storage/liked-verse-queries";
import { failLikes, forgetLikedVerses, likeVerse, likedVerses } from "@tests/mocks/liked-verses";

jest.mock("@/core/storage/liked-verses", () =>
  jest.requireActual<object>("@tests/mocks/liked-verses"),
);

const TODAY = { date: "2026-10-19", reference: "Colossians 3:13" };

/** The like, once the device's likes have been read. */
async function renderLike() {
  const view = renderHook(() => useLikedVerse(TODAY));
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  return view;
}

beforeEach(() => forgetLikedVerses());

describe("useLikedVerse", () => {
  it("isn't liked until it's liked", async () => {
    const { result } = await renderLike();

    expect(result.current.liked).toBe(false);
  });

  it("remembers a like made before", async () => {
    await likeVerse("user-1", TODAY);

    const { result } = await renderLike();

    expect(result.current.liked).toBe(true);
  });

  it("is liked at once when it's liked, and the like is kept on the phone", async () => {
    const { result } = await renderLike();

    act(() => result.current.toggle());

    // Shown before the phone has kept it.
    await waitFor(() => expect(result.current.liked).toBe(true));
    await waitFor(() => expect(likedVerses().has(TODAY.date)).toBe(true));
  });

  it("takes the like back when it's pressed again", async () => {
    await likeVerse("user-1", TODAY);
    const { result } = await renderLike();

    act(() => result.current.toggle());

    await waitFor(() => expect(result.current.liked).toBe(false));
    await waitFor(() => expect(likedVerses().has(TODAY.date)).toBe(false));
  });

  it("goes back to how it was when the phone can't keep the like", async () => {
    const { result } = await renderLike();
    failLikes();

    act(() => result.current.toggle());

    await waitFor(() => expect(result.current.liked).toBe(false));
    expect(likedVerses().has(TODAY.date)).toBe(false);
  });
});
