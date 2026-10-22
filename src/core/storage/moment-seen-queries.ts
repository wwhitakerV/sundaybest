import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import { getSeenMoments, markMomentSeen, type Moment } from "./moments-seen";

function seenKey(userId: string | null) {
  return ["local", "moments-seen", userId ?? "no-user"] as const;
}

/**
 * Whether this reader has had `moment` on this phone — null until the phone's
 * said — and marking it had. Marked, it's had at once; if the phone can't keep
 * it, it simply plays again another time.
 */
export function useSeenMoment(moment: Moment) {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const query = useQuery({
    queryKey: seenKey(userId),
    queryFn: () => getSeenMoments(userId!),
    enabled: userId !== null,
  });

  return {
    seen: query.isSuccess ? query.data.includes(moment) : null,
    markSeen: () => {
      if (userId === null) return;
      queryClient.setQueryData<Moment[]>(seenKey(userId), (current) =>
        current?.includes(moment) ? current : [...(current ?? []), moment],
      );
      void markMomentSeen(userId, moment).catch(() => undefined);
    },
  };
}
