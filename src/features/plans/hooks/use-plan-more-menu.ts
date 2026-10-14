import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useResetPlanMutation } from "@/core/api/plan-reset";
import { errorFeedback, tapFeedback } from "@/core/haptics/haptics";
import { PLACE_ROUTES, placePageHref, toPlace, type TabPage } from "@/entities/tabs";
import { useFocusedPlace } from "@/hooks/use-focused-place";
import { getMoreMenuItems, type MoreMenuKey } from "../logic/more-menu";

/** Plan Detail's More menu, with a reset behind a confirmation. */
export function usePlanMoreMenu(planId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const resetMutation = useResetPlanMutation();
  const focusedPlace = useFocusedPlace(PLACE_ROUTES);

  // Over the plan, where it is — its tab, Plans' search, over Weeks — so Back returns to it.
  const openHere = (page: TabPage) =>
    router.push(placePageHref(toPlace(focusedPlace(), "plans"), page));

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
