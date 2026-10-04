import { useState } from "react";
import { useRouter } from "expo-router";

import { useSetPlanSavedMutation } from "@/core/api/queries";
import { selectionFeedback } from "@/core/haptics/haptics";
import {
  DAILY_REMINDER_HREF,
  HOW_PLANS_ARE_MADE_HREF,
  getMoreMenuItems,
  type MoreMenuKey,
} from "../logic/more-menu";

/** Plan Detail's More menu, backed by the real saved-plan API state. */
export function usePlanMoreMenu(planId: string, saved: boolean) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const savedMutation = useSetPlanSavedMutation();

  const actions: Record<MoreMenuKey, () => void> = {
    save: () => {
      selectionFeedback();
      savedMutation.mutate({ planId, saved: !saved });
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
