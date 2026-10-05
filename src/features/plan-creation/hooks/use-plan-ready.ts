import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { LocalTime } from "@/types/domain";
import { studyHref, HOME_HREF } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  usePlanQuery,
  useRemindersQuery,
  useStartPlanMutation,
  useUpdateReminderMutation,
} from "@/core/api/queries";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";
import { syncLocalReminder } from "@/core/notifications/local-reminders";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";

/** Plan Ready backed by the generated server plan and synced reminder settings. */
export function usePlanReady() {
  const router = useRouter();
  const session = useModalSession();
  const params = useLocalSearchParams<{ planId?: string | string[] }>();
  const planId = firstParam(params.planId);

  const planQuery = usePlanQuery(planId);
  const remindersQuery = useRemindersQuery();
  const startPlan = useStartPlanMutation();
  const updateReminder = useUpdateReminderMutation();

  const plan = planQuery.data?.plan ?? null;
  const reminder =
    remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy") ?? null;

  async function selectTime(time: LocalTime) {
    if (!reminder || updateReminder.isPending) return;
    if (!reminder.enabled || reminder.time !== time) selectionFeedback();

    try {
      const { reminder: updated } = await updateReminder.mutateAsync({
        kind: "dailyStudy",
        input: {
          enabled: true,
          time,
          days: reminder.days,
        },
      });
      await syncLocalReminder(updated);
    } catch {
      Alert.alert("Couldn’t update reminder", "Try again in a moment.");
    }
  }

  async function start() {
    if (!plan || startPlan.isPending) return;
    tapFeedback();

    try {
      const started = await startPlan.mutateAsync(plan.id);

      const currentReminder =
        remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy") ?? null;
      if (currentReminder?.enabled) {
        const granted = await requestNotificationPermission();
        if (granted) await syncLocalReminder(currentReminder);
      }

      router.replace(studyHref(started.plan.id, 1));
    } catch {
      Alert.alert("Couldn’t start your plan", "Try again in a moment.");
    }
  }

  return {
    plan,
    reminder,
    loading: planQuery.isPending || remindersQuery.isPending,
    busy: startPlan.isPending || updateReminder.isPending,
    selectTime,
    start,
    notNow: () => session.exitTo(HOME_HREF),
  };
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
