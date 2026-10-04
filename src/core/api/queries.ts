import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ApiReminder,
  ApiUser,
  ApiUserSettings,
  ReminderKind,
  UpdateReminderRequest,
  UpdateSettingsRequest,
} from "./contracts";
import { createIdempotencyKey } from "./idempotency";
import { apiQueryKeys } from "./query-keys";
import { useSundayBestApi } from "./ApiProvider";

type MeEnvelope = { user: ApiUser };
type SettingsEnvelope = { settings: ApiUserSettings };
type RemindersEnvelope = { reminders: ApiReminder[] };

export function useCurrentUserQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.me, queryFn: () => api.user.getMe() });
}

export function useUserSettingsQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.settings, queryFn: () => api.settings.get() });
}

export function useRemindersQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.reminders, queryFn: () => api.reminders.list() });
}

export function useCompleteOnboardingMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.user.completeOnboarding(createIdempotencyKey("user:onboarding")),
    onSuccess: (data) => queryClient.setQueryData<MeEnvelope>(apiQueryKeys.me, data),
  });
}

export function useUpdateSettingsMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsRequest) =>
      api.settings.update(input, createIdempotencyKey("settings:update")),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.settings });
      const previous = queryClient.getQueryData<SettingsEnvelope>(apiQueryKeys.settings);
      if (previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, {
          settings: { ...previous.settings, ...input },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, context.previous);
      }
    },
    onSuccess: (data) => queryClient.setQueryData<SettingsEnvelope>(apiQueryKeys.settings, data),
  });
}

export function useUpdateReminderMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, input }: { kind: ReminderKind; input: UpdateReminderRequest }) =>
      api.reminders.update(kind, input, createIdempotencyKey(`reminder:${kind}`)),
    onMutate: async ({ kind, input }) => {
      await queryClient.cancelQueries({ queryKey: apiQueryKeys.reminders });
      const previous = queryClient.getQueryData<RemindersEnvelope>(apiQueryKeys.reminders);
      if (previous) {
        queryClient.setQueryData<RemindersEnvelope>(apiQueryKeys.reminders, {
          reminders: previous.reminders.map((item) =>
            item.kind === kind ? { ...item, ...input } : item,
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
    },
  });
}
