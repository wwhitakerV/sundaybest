import { useState } from "react";
import { useRouter } from "expo-router";

import { selectionFeedback } from "@/core/haptics/haptics";
import { isSaved, useAppSelector, useStoreActions } from "@/core/store";
import {
  DAILY_REMINDER_HREF,
  HOW_PLANS_ARE_MADE_HREF,
  getMoreMenuItems,
  type MoreMenuKey,
} from "../logic/more-menu";

/**
 * Plan Detail's More menu: whether it's open, and what each item does —
 * Save plan toggles the plan in the library (a selection haptic, as a choice
 * that changed); the other two open their Settings page.
 */
export function usePlanMoreMenu(planId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const saved = useAppSelector((state) => isSaved(state, "plan", planId));
  const { savePlan, removeSavedPlan } = useStoreActions();

  const actions: Record<MoreMenuKey, () => void> = {
    save: () => {
      selectionFeedback();
      if (saved) removeSavedPlan(planId);
      else savePlan(planId);
    },
    reminder: () => router.push(DAILY_REMINDER_HREF),
    howMade: () => router.push(HOW_PLANS_ARE_MADE_HREF),
  };

  return {
    open,
    saved,
    show: () => setOpen(true),
    close: () => setOpen(false),
    items: getMoreMenuItems(saved).map((item) => ({ ...item, select: actions[item.key] })),
  };
}
