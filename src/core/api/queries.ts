import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ApiPlanDetail,
  ApiPlanSummary,
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
type PlansEnvelope = { plans: ApiPlanSummary[] };
type PlanEnvelope = { plan: ApiPlanDetail };

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

export function usePlansQuery() {
  const api = useSundayBestApi();
  return useQuery({ queryKey: apiQueryKeys.plans, queryFn: () => api.plans.list() });
}

export function usePlanQuery(planId: string) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.plan(planId),
    queryFn: () => api.plans.get(planId),
    enabled: planId.length > 0,
  });
}

export function useProgressQuery(weekStart: string) {
  const api = useSundayBestApi();
  return useQuery({
    queryKey: apiQueryKeys.progress(weekStart),
    queryFn: () => api.progress.get(weekStart),
  });
}

export function useSermonSearchQuery(query: string, enabled = true) {
  const api = useSundayBestApi();
  const normalized = query.trim();
  return useQuery({
    queryKey: apiQueryKeys.sermonSearch(normalized),
    queryFn: () => api.sermons.search(normalized),
    enabled: enabled && normalized.length >= 2,
  });
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

export function useStartPlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      api.plans.start(planId, createIdempotencyKey(`plan:${planId}:start`)),
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(plan.id), { plan });
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
    },
  });
}

export function useArchivePlanMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      api.plans.archive(planId, createIdempotencyKey(`plan:${planId}:archive`)),
    onSuccess: ({ plan }) => {
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === plan.id ? plan : item)) }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.plan(plan.id) });
      void queryClient.invalidateQueries({ queryKey: apiQueryKeys.progressRoot });
    },
  });
}

export function useSetPlanSavedMutation() {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, saved }: { planId: string; saved: boolean }) =>
      saved
        ? api.plans.save(planId, createIdempotencyKey(`plan:${planId}:save`))
        : api.plans.removeSaved(planId, createIdempotencyKey(`plan:${planId}:unsave`)),
    onMutate: async ({ planId, saved }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: apiQueryKeys.plans }),
        queryClient.cancelQueries({ queryKey: apiQueryKeys.plan(planId) }),
      ]);
      const previousPlans = queryClient.getQueryData<PlansEnvelope>(apiQueryKeys.plans);
      const previousPlan = queryClient.getQueryData<PlanEnvelope>(apiQueryKeys.plan(planId));
      queryClient.setQueryData<PlansEnvelope>(apiQueryKeys.plans, (current) =>
        current
          ? { plans: current.plans.map((item) => (item.id === planId ? { ...item, saved } : item)) }
          : current,
      );
      queryClient.setQueryData<PlanEnvelope>(apiQueryKeys.plan(planId), (current) =>
        current ? { plan: { ...current.plan, saved } } : current,
      );
      return { previousPlans, previousPlan, planId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      if (context.previousPlans) queryClient.setQueryData(apiQueryKeys.plans, context.previousPlans);
      if (context.previousPlan) queryClient.setQueryData(apiQueryKeys.plan(context.planId), context.previousPlan);
    },
  });
}
