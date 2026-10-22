import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import {
  forgetGameResult,
  getGameResults,
  recordGameResult,
  type Game,
  type GameResult,
} from "./game-results";

function resultsKey(userId: string | null, game: Game) {
  return ["local", "game-results", game, userId ?? "no-user"] as const;
}

/**
 * This reader's results in a daily game on this phone — undefined until the
 * phone's said — and recording a day's. Recorded, it shows at once; a day
 * already played keeps its first result.
 */
export function useGameResults(game: Game) {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const key = resultsKey(userId, game);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getGameResults(userId!, game),
    enabled: userId !== null,
  });

  return {
    results: query.data,
    record: (result: GameResult) => {
      if (userId === null) return;
      queryClient.setQueryData<GameResult[]>(key, (current) =>
        current?.some((played) => played.daily === result.daily)
          ? current
          : [...(current ?? []), result],
      );
      void recordGameResult(userId, game, result).catch(() => undefined);
    },
    /** Forgets a day's result, so it can be played again — development builds' replay only. */
    forget: async (daily: number) => {
      if (userId === null) return;
      queryClient.setQueryData<GameResult[]>(key, (current) =>
        current?.filter((played) => played.daily !== daily),
      );
      await forgetGameResult(userId, game, daily).catch(() => undefined);
    },
  };
}
