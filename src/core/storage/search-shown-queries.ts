import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import { isSearchEarned } from "@/utils/search/isSearchEarned";
import { getShownSearches, markSearchShown, type SearchList } from "./searches-shown";

function shownKey(userId: string | null) {
  return ["local", "searches-shown", userId ?? "no-user"] as const;
}

/**
 * Whether `list` offers search: once it holds `threshold` items, and from
 * then on, recorded on this phone, though it shrinks again — so the app's
 * search grows in as the reader needs it and is never taken away.
 */
export function useEarnedSearch(list: SearchList, count: number, threshold: number): boolean {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const query = useQuery({
    queryKey: shownKey(userId),
    queryFn: () => getShownSearches(userId!),
    enabled: userId !== null,
  });
  const shownBefore = query.data?.includes(list) ?? false;
  const earned = isSearchEarned({ count, threshold, shownBefore });

  // Kept in step with the phone: the first time it's earned, it's recorded there.
  const record = userId !== null && query.isSuccess && earned && !shownBefore;
  useEffect(() => {
    if (!record || userId === null) return;
    queryClient.setQueryData<SearchList[]>(shownKey(userId), (current) => [
      ...(current ?? []),
      list,
    ]);
    // A failed write is tried again the next time the list is opened.
    void markSearchShown(userId, list).catch(() => undefined);
  }, [record, userId, list, queryClient]);

  return earned;
}
