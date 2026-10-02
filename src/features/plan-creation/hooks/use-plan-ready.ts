import { useLocalSearchParams, useRouter } from "expo-router";

import type { LocalTime } from "@/types/domain";
import { parsePlanParams, studyHref, HOME_HREF } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { requestNotificationPermission } from "@/core/notifications/request-notification-permission";
import {
  getPlanById,
  getReminder,
  getSamplePlan,
  useAppSelector,
  useStoreActions,
} from "@/core/store";

/**
 * Plan Ready's view model: the plan just built (none when opened bare), the
 * daily reminder, and the ways on. Start begins the plan, asks to send
 * reminders, and opens its first day — the sample's, without a plan of its
 * own — replacing the New Plan modal with the study session rather than
 * stacking one on the other.
 */
export function usePlanReady() {
  const router = useRouter();
  const session = useModalSession();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? null;
  const plan = useAppSelector((state) => (planId ? getPlanById(state, planId) : null));
  const sample = useAppSelector(getSamplePlan);
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const { startPlan, turnOnReminderAt } = useStoreActions();

  return {
    plan,
    reminder,
    selectTime: (time: LocalTime) => {
      if (!reminder) return;
      if (!reminder.enabled || reminder.time !== time) selectionFeedback();
      turnOnReminderAt(reminder.id, time);
    },
    start: async () => {
      // Without a plan of its own (opened bare), it starts the sample.
      const started = plan ?? sample;
      if (!started) return;
      tapFeedback();
      if (plan) startPlan(plan.id);
      await requestNotificationPermission();
      // Replace, not push: the new-plan modal hands off to the study session
      // modal rather than stacking one modal on top of the other.
      router.replace(studyHref(started.id, 1));
    },
    notNow: () => session.exitTo(HOME_HREF),
  };
}
