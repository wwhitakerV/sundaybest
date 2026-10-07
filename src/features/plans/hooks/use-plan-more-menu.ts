import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useResetPlanMutation } from "@/core/api/plan-reset";
import { useSetPlanSavedMutation } from "@/core/api/queries";
import { errorFeedback, selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  DAILY_REMINDER_HREF,
  HOW_PLANS_ARE_MADE_HREF,
  getMoreMenuItems,
  type MoreMenuKey,
} from "../logic/more-menu";

/** Plan Detail's More menu, backed by the real saved-plan API state, with a reset behind a confirmation. */
export function usePlanMoreMenu(planId: string, saved: boolean) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const savedMutation = useSetPlanSavedMutation();
  const resetMutation = useResetPlanMutation();

  const reset = () => {
    tapFeedback();
    resetMutation.mutate(planId, {
      onError: () => {
        errorFeedback();
        Alert.alert(
          "Couldn’t reset this plan",
          "SundayBest couldn’t reach the server. Check your connection and try again.",
        );
      },
    });
  };

  const actions: Record<MoreMenuKey, () => void> = {
    save: () => {
      selectionFeedback();
      savedMutation.mutate({ planId, saved: !saved });
    },
    reminder: () => router.push(DAILY_REMINDER_HREF),
    howMade: () => router.push(HOW_PLANS_ARE_MADE_HREF),
    // Asked first: it can't be undone.
    reset: () =>
      Alert.alert(
        "Reset this plan?",
        "Your progress, answers, and quiz scores will be cleared. The plan itself stays.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: reset },
        ],
      ),
  };

  return {
    open,
    saved,
    show: () => setOpen(true),
    close: () => setOpen(false),
    items: getMoreMenuItems(saved).map((item) => ({ ...item, select: actions[item.key] })),
  };
}
