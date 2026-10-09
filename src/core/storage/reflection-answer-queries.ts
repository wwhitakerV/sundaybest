import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/reader-queries";
import {
  countAllReflectionAnswers,
  getAllReflectionAnswers,
  countReflectionAnswers,
  getReflectionAnswers,
  saveReflectionAnswer,
  type LocalReflectionAnswer,
} from "./reflection-answers";

/**
 * The device-only reflection answers, read and written through TanStack
 * Query so the Daily Study and Plan Complete see one copy. These are the
 * cache roots; a plan reset clears everything under them.
 */
export const LOCAL_ANSWERS = ["local", "reflection-answers"] as const;
export const LOCAL_ANSWER_COUNTS = ["local", "reflection-answer-count"] as const;

function answersKey(userId: string | null, ids: readonly string[]) {
  return [...LOCAL_ANSWERS, userId ?? "no-user", ...ids] as const;
}

function countRoot(userId: string | null) {
  return [...LOCAL_ANSWER_COUNTS, userId ?? "no-user"] as const;
}

function countKey(userId: string | null, ids: readonly string[]) {
  return [...countRoot(userId), ...ids] as const;
}

export function useReflectionAnswers(reflectionIds: readonly string[]) {
  const queryClient = useQueryClient();
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const ids = [...reflectionIds];
  const query = useQuery({
    queryKey: answersKey(userId, ids),
    queryFn: () => getReflectionAnswers(userId!, ids),
    enabled: userId !== null,
  });

  const answerFor = (reflectionId: string) => query.data?.[reflectionId]?.answer ?? "";

  const changeAnswer = (reflectionId: string, answer: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    queryClient.setQueryData<Record<string, LocalReflectionAnswer>>(
      answersKey(userId, ids),
      (current) => {
        const next = { ...(current ?? {}) };
        if (answer.length === 0) {
          delete next[reflectionId];
        } else {
          const previous = next[reflectionId];
          next[reflectionId] = {
            reflectionId,
            answer,
            answeredAt: previous?.answeredAt ?? now,
            updatedAt: now,
          };
        }
        return next;
      },
    );

    // Device-only autosave. The answer never enters an API mutation/outbox.
    void saveReflectionAnswer(userId, reflectionId, answer)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: countRoot(userId) });
      })
      .catch(() => {
        // The in-memory draft stays visible. A later keystroke will retry the
        // serialized device write; reflection text is never sent to the API.
      });
  };

  return {
    loading: me.isPending || (userId !== null && query.isPending),
    answerFor,
    changeAnswer,
  } as const;
}

export function useReflectionAnswerCount(reflectionIds: readonly string[]) {
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  const ids = [...reflectionIds];
  return useQuery({
    queryKey: countKey(userId, ids),
    queryFn: () => countReflectionAnswers(userId!, ids),
    enabled: userId !== null,
  });
}

/**
 * How many reflections this reader has written on this phone, in all. Under
 * the counts' cache root, so a plan reset clears it; read afresh each time
 * it's shown, since the Study writes answers under other keys.
 */
export function useReflectionTotal() {
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  return useQuery({
    queryKey: [...countRoot(userId), "all"] as const,
    queryFn: () => countAllReflectionAnswers(userId!),
    enabled: userId !== null,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * Every private answer written on this phone, by question — for Progress's
 * weeks, where each week shows the first thing written in it. Under the
 * answers' root, so a plan reset clears it; read afresh each time it's shown.
 */
export function useAllReflectionAnswers() {
  const me = useCurrentUserQuery();
  const userId = me.data?.user.id ?? null;
  return useQuery({
    queryKey: [...LOCAL_ANSWERS, userId ?? "no-user", "all"] as const,
    queryFn: () => getAllReflectionAnswers(userId!),
    enabled: userId !== null,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
