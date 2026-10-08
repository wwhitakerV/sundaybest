import { Fragment } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Popover, type PopoverAnchor } from "./Popover";

/** As wide as iOS's own menus. */
const WIDTH = 250;
const ROW_HEIGHT = 48;
const ICON_SIZE = 20;

type PopoverMenuItem = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  testID: string;
};

export type PopoverMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: readonly PopoverMenuItem[];
  /** Where its top-right corner sits, in points from the screen's top and right edges. */
  anchor: PopoverAnchor;
  accessibilityLabel: string;
  testID: string;
};

/**
 * A menu that opens from the button that asked for it, in the app's one
 * `Popover`. Each item is its label with its icon at the end. Picking one
 * closes the menu, then does it; a tap anywhere else just closes.
 */
export function PopoverMenu({
  visible,
  onClose,
  items,
  anchor,
  accessibilityLabel,
  testID,
}: PopoverMenuProps) {
  return (
    <Popover
      testID={testID}
      accessibilityRole="menu"
      accessibilityLabel={accessibilityLabel}
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      width={WIDTH}
    >
      {items.map((item, index) => (
        <Fragment key={item.testID}>
          {index > 0 && <Divider />}
          <MenuRow
            item={item}
            onPress={() => {
              onClose();
              item.onPress();
            }}
          />
        </Fragment>
      ))}
    </Popover>
  );
}

function MenuRow({ item, onPress }: { item: PopoverMenuItem; onPress: () => void }) {
  const theme = useTheme();
  const Icon = item.icon;

  return (
    <Pressable
      testID={item.testID}
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { gap: space[12], paddingHorizontal: space[16] },
        pressed && { backgroundColor: theme.colors.segmentBackground },
      ]}
    >
      <SFProBody style={styles.label} numberOfLines={1}>
        {item.label}
      </SFProBody>
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  label: { flex: 1 },
});
