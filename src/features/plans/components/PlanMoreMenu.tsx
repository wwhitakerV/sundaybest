import { Bell, RotateCcw, Sparkles, type LucideIcon } from "lucide-react-native";

import { PopoverMenu } from "@/ui/organisms/PopoverMenu";
import type { MoreMenuKey } from "../logic/more-menu";

const TEST_IDS: Record<MoreMenuKey, string> = {
  reminder: "plan-overview-more-reminder",
  howMade: "plan-overview-more-how-made",
  reset: "plan-overview-more-reset",
};

const ICONS: Record<MoreMenuKey, LucideIcon> = {
  reminder: Bell,
  howMade: Sparkles,
  reset: RotateCcw,
};

export type PlanMoreMenuProps = {
  open: boolean;
  onClose: () => void;
  items: readonly { key: MoreMenuKey; label: string; select: () => void }[];
  /** Its top-right corner, under the More button. */
  anchor: { top: number; right: number };
};

/** Plan Detail's More menu, hanging from the More button: each item with its icon. */
export function PlanMoreMenu({ open, onClose, items, anchor }: PlanMoreMenuProps) {
  return (
    <PopoverMenu
      testID="plan-overview-more-menu"
      accessibilityLabel="More"
      visible={open}
      onClose={onClose}
      anchor={anchor}
      items={items.map((item) => ({
        label: item.label,
        icon: ICONS[item.key],
        onPress: item.select,
        testID: TEST_IDS[item.key],
      }))}
    />
  );
}
