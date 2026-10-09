import { Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Popover, type PopoverAnchor } from "./Popover";

/** As wide as iOS's own menus. */
const WIDTH = 250;
const ROW_HEIGHT = 48;
/** Beside an aside, the items keep to this width: room for a short label and its icon. */
const ITEMS_WIDTH = 176;
/** A divider's line between rows: counted in the menu's height. */
const DIVIDER = 1;
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
  /**
   * Beside the items, on their left, as tall as the menu inside its padding:
   * a picture of what they act on (a plan's artwork), so it's plain which
   * thing the menu is for. Shown whole, at `asideRatio` (width over height).
   */
  aside?: ReactNode;
  /** The aside's shape, width over height: a thumbnail's 16:9 by default. */
  asideRatio?: number;
  /** Dims the page a little while it's open (`Popover`'s `dim`). */
  dim?: boolean;
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
  aside,
  asideRatio = 16 / 9,
  dim = false,
  testID,
}: PopoverMenuProps) {
  // The aside runs the items' full height inside the padding, and takes its width from its shape.
  const asideHeight = items.length * ROW_HEIGHT + (items.length - 1) * DIVIDER - space[8] * 2;
  const asideWidth = asideHeight * asideRatio;
  const rows = items.map((item, index) => (
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
  ));

  return (
    <Popover
      testID={testID}
      accessibilityRole="menu"
      accessibilityLabel={accessibilityLabel}
      visible={visible}
      onClose={onClose}
      anchor={anchor}
      dim={dim}
      width={aside ? space[8] + asideWidth + ITEMS_WIDTH : WIDTH}
    >
      {aside ? (
        <View style={styles.withAside}>
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={{ padding: space[8], paddingRight: 0 }}
          >
            <View style={{ width: asideWidth, height: asideHeight }}>{aside}</View>
          </View>
          <View style={styles.items}>{rows}</View>
        </View>
      ) : (
        rows
      )}
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
      style={[styles.row, { gap: space[12], paddingHorizontal: space[16] }]}
    >
      <SFProBody style={styles.label} numberOfLines={1}>
        {item.label}
      </SFProBody>
      <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  withAside: { flexDirection: "row" },
  items: { flex: 1 },
  row: { minHeight: ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  label: { flex: 1 },
});
