import {
  Bell,
  BookmarkMinus,
  BookmarkPlus,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

import { PopoverMenu } from "@/ui/organisms/PopoverMenu";
import type { MoreMenuKey } from "../logic/more-menu";

const TEST_IDS: Record<MoreMenuKey, string> = {
  save: "plan-overview-more-save",
  reminder: "plan-overview-more-reminder",
  howMade: "plan-overview-more-how-made",
  reset: "plan-overview-more-reset",
};

export type PlanMoreMenuProps = {
  open: boolean;
  onClose: () => void;
  /** Whether the plan's in Saved — which way the save item's bookmark points. */
  saved: boolean;
  items: readonly { key: MoreMenuKey; label: string; select: () => void }[];
  /** Its top-right corner, under the More button. */
  anchor: { top: number; right: number };
};

/** Plan Detail's More menu, hanging from the More button: each item with its icon. */
export function PlanMoreMenu({ open, onClose, saved, items, anchor }: PlanMoreMenuProps) {
  const icons: Record<MoreMenuKey, LucideIcon> = {
    save: saved ? BookmarkMinus : BookmarkPlus,
    reminder: Bell,
    howMade: Sparkles,
    reset: RotateCcw,
  };

  return (
    <PopoverMenu
      testID="plan-overview-more-menu"
      accessibilityLabel="More"
      visible={open}
      onClose={onClose}
      anchor={anchor}
      items={items.map((item) => ({
        label: item.label,
        icon: icons[item.key],
        onPress: item.select,
        testID: TEST_IDS[item.key],
      }))}
    />
  );
}
