import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";

import { API_URL, aSermon } from "@tests/factories/api";
import { uuid } from "@tests/factories/api-plans";
import { server } from "@tests/mocks/server";
import { useSermonSearch } from "@/features/plan-creation/hooks/use-sermon-search";

/** Two sermons per search, their ids from the words searched. */
function sermonsFor(query: string) {
  const seed = query.length * 10;
  return [
    aSermon({ id: uuid(seed + 1), title: `${query} one` }),
    aSermon({ id: uuid(seed + 2), title: `${query} two` }),
  ];
}

/**
 * Serves the sermon search, and returns the searches asked for. A search for a
 * word in `held` waits until its release is called.
 */
function serveSearch({
  fail = false,
  held = {},
}: { fail?: boolean; held?: Record<string, Promise<void>> } = {}) {
  const asked: string[] = [];
  server.use(
    http.get(`${API_URL}/v1/sermons/search`, async ({ request }) => {
      const query = new URL(request.url).searchParams.get("q") ?? "";
      asked.push(query);
      await held[query];
      return fail
        ? HttpResponse.json({ error: { code: "INVALID_REQUEST", message: "No" } }, { status: 400 })
        : HttpResponse.json({ sermons: sermonsFor(query) });
    }),
  );
  return asked;
}

function renderSearch(query: string, enabled = true) {
  return renderHook(({ q, on }: { q: string; on: boolean }) => useSermonSearch(q, on), {
    initialProps: { q: query, on: enabled },
  });
}

/** Searched and settled. */
async function renderSearched(query: string) {
  const view = renderSearch(query);
  await waitFor(() => expect(view.result.current.status).toBe("ready"));
  return view;
}

const titles = (results: readonly { sermon: { title: string } }[]) =>
  results.map(({ sermon }) => sermon.title);

describe("useSermonSearch", () => {
  it("is idle, with nothing, while switched off", () => {
    const asked = serveSearch();
    const { result } = renderSearch("grace", false);

    expect(result.current).toMatchObject({ status: "idle", results: [] });
    expect(asked).toEqual([]);
  });

  it("is idle, with nothing, for fewer than two characters", () => {
    const asked = serveSearch();
    const { result } = renderSearch("g");

    expect(result.current).toMatchObject({ status: "idle", results: [] });
    expect(asked).toEqual([]);
  });

  it("waits while the reader may still be typing, asking nothing yet", () => {
    const asked = serveSearch();
    const { result } = renderSearch("grace");

    expect(result.current.status).toBe("waiting");
    expect(asked).toEqual([]);
  });

  it("searches once typing stops, and shows what it found", async () => {
    const asked = serveSearch();
    const { result } = await renderSearched("grace");

    expect(asked).toEqual(["grace"]);
    expect(titles(result.current.results)).toEqual(["grace one", "grace two"]);
  });

  it("searches the words cleaned up: trimmed, with single spaces", async () => {
    const asked = serveSearch();
    await renderSearched("  amazing   grace ");

    expect(asked).toEqual(["amazing grace"]);
  });

  it("keeps the rows it has while a new search waits and runs", async () => {
    const asked = serveSearch();
    const view = await renderSearched("grace");
    const before = view.result.current.results;

    view.rerender({ q: "hope", on: true });

    expect(view.result.current).toMatchObject({ status: "waiting", results: before });
    await waitFor(() => expect(asked).toEqual(["grace", "hope"]));
    await waitFor(() => expect(view.result.current.status).toBe("ready"));
    expect(titles(view.result.current.results)).toEqual(["hope one", "hope two"]);
  });

  it("says it's searching while a search is out", async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    serveSearch({ held: { grace: held } });
    const { result } = renderSearch("grace");

    await waitFor(() => expect(result.current.status).toBe("searching"));
    release();
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("reuses the last search's results for the same words, asking nothing", async () => {
    const asked = serveSearch();
    const view = await renderSearched("grace");
    const before = view.result.current.results;

    view.rerender({ q: "Grace ", on: true });

    expect(view.result.current).toMatchObject({ status: "ready", results: before });
    expect(asked).toEqual(["grace"]);
  });

  it("keeps the same rows, not a copy, when a new search finds the same sermons", async () => {
    serveSearch();
    // "grace" and "faith" are the same length, so they find the same sermons.
    const view = await renderSearched("grace");
    const before = view.result.current.results;

    view.rerender({ q: "faith", on: true });
    await waitFor(() => expect(view.result.current.status).toBe("ready"));

    expect(view.result.current.results).toBe(before);
  });

  it("forgets its rows when the words get too short", async () => {
    const asked = serveSearch();
    const view = await renderSearched("grace");

    view.rerender({ q: "g", on: true });
    expect(view.result.current).toMatchObject({ status: "idle", results: [] });

    view.rerender({ q: "grace", on: true });
    expect(view.result.current).toMatchObject({ status: "waiting", results: [] });
    await waitFor(() => expect(view.result.current.status).toBe("ready"));
    expect(asked).toEqual(["grace", "grace"]);
  });

  it("forgets its rows when switched off", async () => {
    serveSearch();
    const view = await renderSearched("grace");

    view.rerender({ q: "grace", on: false });

    expect(view.result.current).toMatchObject({ status: "idle", results: [] });
  });

  it("says so when the search fails, keeping the rows it had", async () => {
    serveSearch();
    const view = await renderSearched("grace");
    const before = view.result.current.results;
    serveSearch({ fail: true });

    view.rerender({ q: "hope", on: true });

    await waitFor(() => expect(view.result.current.status).toBe("error"));
    expect(view.result.current.results).toBe(before);
  });

  it("searches at once on submit, without waiting", async () => {
    const asked = serveSearch();
    const { result } = renderSearch("grace");

    act(() => result.current.submit());

    await waitFor(() => expect(asked).toEqual(["grace"]));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    // The wait it skipped never fires a second search.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(asked).toEqual(["grace"]);
  });

  it("does nothing on submit while switched off", async () => {
    const asked = serveSearch();
    const { result } = renderSearch("grace", false);

    act(() => result.current.submit());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(asked).toEqual([]);
    expect(result.current.status).toBe("idle");
  });

  it("ignores an earlier search that answers after a later one", async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const asked = serveSearch({ held: { grace: held } });
    const view = renderSearch("grace");
    await waitFor(() => expect(view.result.current.status).toBe("searching"));

    view.rerender({ q: "hope", on: true });
    await waitFor(() => expect(asked).toEqual(["grace", "hope"]));
    await waitFor(() => expect(view.result.current.status).toBe("ready"));
    release();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(titles(view.result.current.results)).toEqual(["hope one", "hope two"]);
  });
});
