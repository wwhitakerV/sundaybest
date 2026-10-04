import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserQuery } from "@/core/api/queries";
import {
  countReflectionAnswers,
  getReflectionAnswers,
  saveReflectionAnswer,
  type LocalReflectionAnswer,
} from "@/core/storage/reflection-answers";

function answersKey(userId: string | null, ids: readonly string[]) {
  return ["local", "reflection-answers", userId ?? "no-user", ...ids] as const;
}

function countRoot(userId: string | null) {
  return ["local", "reflection-answer-count", userId ?? "no-user"] as const;
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
