import { http, HttpResponse } from "msw";
import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@tests/helpers/render";

import { API_URL, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { apiQueryKeys } from "@/core/api/query-keys";
import { useUpdateSettingsMutation } from "@/core/api/reader-queries";

/** The settings update, beside the cache it updates. */
function renderUpdate() {
  return renderHook(() => ({ update: useUpdateSettingsMutation(), cache: useQueryClient() }));
}

const SEEDED = {
  studyDay: apiQueryKeys.studyDay("plan-1", 1),
  week: apiQueryKeys.week("2026-10-04"),
  word: apiQueryKeys.word,
  plans: apiQueryKeys.plans,
  weeks: apiQueryKeys.weeks,
} as const;

describe("useUpdateSettingsMutation", () => {
  it("refreshes everything in the reader's translation when the translation changes — and nothing else", async () => {
    server.use(
      http.patch(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ settings: someSettings({ bibleTranslation: "ESV" }) }),
      ),
    );
    const { result } = renderUpdate();
    for (const key of Object.values(SEEDED)) result.current.cache.setQueryData(key, { seeded: true });

    await act(async () => {
      await result.current.update.mutateAsync({ bibleTranslation: "ESV" });
    });

    const stale = (key: readonly unknown[]) =>
      result.current.cache.getQueryState(key)?.isInvalidated ?? false;
    await waitFor(() => expect(stale(SEEDED.week)).toBe(true));
    expect(stale(SEEDED.studyDay)).toBe(true);
    expect(stale(SEEDED.word)).toBe(true);
    expect(stale(SEEDED.plans)).toBe(false);
    expect(stale(SEEDED.weeks)).toBe(false);
  });

  it("leaves them be when something else changes (the text size)", async () => {
    server.use(
      http.patch(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ settings: someSettings({ textSize: "large" }) }),
      ),
    );
    const { result } = renderUpdate();
    result.current.cache.setQueryData(SEEDED.week, { seeded: true });

    await act(async () => {
      await result.current.update.mutateAsync({ textSize: "large" });
    });

    expect(result.current.cache.getQueryState(SEEDED.week)?.isInvalidated).toBe(false);
  });
});
