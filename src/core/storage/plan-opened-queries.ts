import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import { getPlansOpened, markPlanOpened } from "./plans-opened";

const NONE: Readonly<Record<string, string>> = {};

function openedKey(userId: string | null) {
  return ["local", "plans-opened", userId ?? "no-user"] as const;
}

/** When this reader last opened each plan on this phone, by plan — none until the phone's said. */
export function usePlansOpened(): Readonly<Record<string, string>> {
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const query = useQuery({
    queryKey: openedKey(userId),
    queryFn: () => getPlansOpened(userId!),
    enabled: userId !== null,
  });
  return query.data ?? NONE;
}

/**
 * Marking a plan opened, now: known at once, and kept on the phone — if the
 * phone can't keep it, Plans simply goes by the plan's own last change.
 */
export function useMarkPlanOpened(): (planId: string) => void {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  return useCallback(
    (planId: string) => {
      if (userId === null) return;
      const at = new Date().toISOString();
      queryClient.setQueryData<Record<string, string>>(openedKey(userId), (current) => ({
        ...current,
        [planId]: at,
      }));
      void markPlanOpened(userId, planId, at).catch(() => undefined);
    },
    [userId, queryClient],
  );
}
