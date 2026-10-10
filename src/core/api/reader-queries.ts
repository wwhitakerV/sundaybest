import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ReminderKind,
  type UpdateReminderRequest,
  type UpdateSettingsRequest,
  getMeResponseSchema,
  getRemindersResponseSchema,
  getSettingsResponseSchema,
} from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiQueryKeys, isStudyDayQueryKey } from "./query-keys";
import { useSundayBestApi } from "./ApiProvider";
import {
  cachedCurrentUserQuery,
  cachedServerQuery,
  isOfflineTransportFailure,
  offlineCacheKeys,
  persistServerCache,
} from "./offline-cache";
import type { MeEnvelope, RemindersEnvelope, SettingsEnvelope } from "./query-cache-sync";
import { enqueueMutation } from "@/core/storage/mutation-outbox";
import { withoutUndefined } from "@/utils/object/withoutUndefined";

// The reader: who they are, their settings and reminders, their progress, and the writes to them.

export function useCurrentUserQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.me,
    queryFn: () =>
      cachedCurrentUserQuery({
        schema: getMeResponseSchema,
        fetcher: () => api.user.getMe(),
      }),
  });
}

export function useUserSettingsQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.settings,
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.settings,
        resourceType: "settings",
        schema: getSettingsResponseSchema,
        fetcher: () => api.settings.get(),
      }),
  });
}

export function useRemindersQuery() {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.reminders,
    queryFn: () =>
      cachedServerQuery({
        cacheKey: offlineCacheKeys.reminders,
        resourceType: "reminders",
        schema: getRemindersResponseSchema,
        fetcher: () => api.reminders.list(),
      }),
  });
}

/**
 * A week of study for Progress. Kept in memory only, never on the device:
 * its key verses are Scripture text some translations don't allow storing.
 */
export function useWeekQuery(weekStart: string) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.week(weekStart),
    queryFn: () => api.week.get(weekStart),
    placeholderData: (previous) => previous,
  });
}

/** Every week a plan ran in, for finding one again. In memory only, like the week it opens. */
export function useWeeksQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.weeks, queryFn: () => api.weeks.get() });
}

/** Every Quick Check the reader has finished, as last taken: what was remembered, and the right answers. */
export function useQuickChecksQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.quickChecks, queryFn: () => api.quickChecks.get() });
}

/** Every reflection question in the reader's plans, for Your words to match with what was written. */
export function useReflectionPromptsQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.reflections, queryFn: () => api.reflections.get() });
}

/** The Word: every passage the reader has finished, each with a line from it. */
export function useWordQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.word, queryFn: () => api.word.get() });
}

export function useCompleteOnboardingMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.user.completeOnboarding(createIdempotencyKey("user:onboarding")),
    onSuccess: (data) => {
      queryClient.setQueryData<MeEnvelope>(apiQueryKeys.me, data);
      void persistServerCache({
        cacheKey: offlineCacheKeys.me,
        resourceType: "me",
        schema: getMeResponseSchema,
        value: data,
      });
    },
  });
}

export function useUpdateSettingsMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsRequest) => {
      const idempotencyKey = createIdempotencyKey("settings:update");
      try {
        return await api.settings.update(input, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        const current = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
        if (!current) throw cause;
        await enqueueMutation({
          kind: "settings.update",
          entityKey: "settings",
          payload: { input },
          idempotencyKey,
        });
        return {
          settings: {
            ...current.settings,
            ...withoutUndefined(input),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.settings });
      const previous = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
      if (previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, {
          settings: { ...previous.settings, ...withoutUndefined(input) },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, context.previous);
      }
    },
    onSuccess: (data, input) => {
      queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, data);
      // A study day carries its Scripture in the reader's translation.
      if (input.bibleTranslation) {
        void queryClient.invalidateQueries({
          predicate: (query) => isStudyDayQueryKey(query.queryKey),
        });
      }
      void persistServerCache({
        cacheKey: offlineCacheKeys.settings,
        resourceType: "settings",
        schema: getSettingsResponseSchema,
        value: data,
      });
    },
  });
}

export function useUpdateReminderMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kind, input }: { kind: ReminderKind; input: UpdateReminderRequest }) => {
      const idempotencyKey = createIdempotencyKey(`reminder:${kind}`);
      try {
        return await api.reminders.update(kind, input, idempotencyKey);
      } catch (cause) {
        if (!isOfflineTransportFailure(cause)) throw cause;
        const current = queryClient
          .getQueryData<RemindersEnvelope>(apiQueryKeys.reminders)
          ?.reminders.find((item) => item.kind === kind);
        if (!current) throw cause;
        await enqueueMutation({
          kind: "reminder.update",
          entityKey: kind,
          payload: { kind, input },
          idempotencyKey,
        });
        return {
          reminder: {
            ...current,
            ...withoutUndefined(input),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    },
    onMutate: async ({ kind, input }) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.reminders });
      const previous = queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders);
      if (previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, {
          reminders: previous.reminders.map((item) =>
            item.kind === kind ? { ...item, ...withoutUndefined(input) } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, context.previous);
      }
    },
    onSuccess: ({ reminder }) => {
      queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, (current) => {
        if (!current) return { reminders: [reminder] };
        const exists = current.reminders.some((item) => item.id === reminder.id);
        return {
          reminders: exists
            ? current.reminders.map((item) => (item.id === reminder.id ? reminder : item))
            : [...current.reminders, reminder],
        };
      });
      void persistServerCache({
        cacheKey: offlineCacheKeys.reminders,
        resourceType: "reminders",
        schema: getRemindersResponseSchema,
        value: queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders),
      });
    },
  });
}
