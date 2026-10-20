import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import { getLikedVerses, likeVerse, unlikeVerse } from "./liked-verses";

function likedKey(userId: string | null) {
  return ["local", "liked-verses", userId ?? "no-user"] as const;
}

/**
 * Whether the day's verse is liked, kept on this phone, and liking it or
 * taking the like back. A press shows at once; if the phone can't keep it, it
 * goes back to how it was.
 */
export function useLikedVerse(verse: { date: string; reference: string }) {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const key = likedKey(userId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getLikedVerses(userId!),
    enabled: userId !== null,
  });
  const liked = query.data?.includes(verse.date) ?? false;

  return {
    liked,
    /** The phone's likes have been read: what `liked` says is so. */
    ready: query.isSuccess,
    toggle: () => {
      if (userId === null || !query.isSuccess) return;
      const before = queryClient.getQueryData<string[]>(key) ?? [];
      const nowLiked = !before.includes(verse.date);
      queryClient.setQueryData<string[]>(
        key,
        nowLiked ? [...before, verse.date] : before.filter((date) => date !== verse.date),
      );
      const saving = nowLiked ? likeVerse(userId, verse) : unlikeVerse(userId, verse.date);
      // The phone couldn't keep it: back to how it was.
      void saving.catch(() => queryClient.setQueryData<string[]>(key, before));
    },
  };
}
