import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useResetPlanMutation } from "@/core/api/plan-reset";
import { errorFeedback, tapFeedback } from "@/core/haptics/haptics";
import { tabPageHref, toAppTab, type TabPage } from "@/entities/tabs";
import { useFocusedTab } from "@/hooks/use-focused-tab";
import { getMoreMenuItems, type MoreMenuKey } from "../logic/more-menu";

/** Plan Detail's More menu, with a reset behind a confirmation. */
export function usePlanMoreMenu(planId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const resetMutation = useResetPlanMutation();
  const focusedTab = useFocusedTab();

  // Over the plan, in its own tab — Back returns to the plan, as iOS does.
  const openHere = (page: TabPage) =>
    router.push(tabPageHref(toAppTab(focusedTab(), "plans"), page));

  const reset = () => {
    tapFeedback();
    resetMutation.mutate(planId, {
      onError: () => {
        errorFeedback();
        Alert.alert(
          "Couldn't reset this plan",
          "SundayBest couldn’t reach the server. Check your connection and try again.",
        );
      },
    });
  };

  const actions: Record<MoreMenuKey, () => void> = {
    reminder: () => openHere("daily-reminder"),
    howMade: () => openHere("how-plans-are-made"),
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
    show: () => setOpen(true),
    close: () => setOpen(false),
    items: getMoreMenuItems().map((item) => ({ ...item, select: actions[item.key] })),
  };
}
