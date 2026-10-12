import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";

/** The edge every field has. */
const EDGE = 1;
/** The icon a field leads with. */
const ICON = 20;
/** From inside a field's edge to its icon, and from its end to what sits there. */
const INSET = space[16];

/** From a field's left edge to its icon's centre: what sits under a field lines up on it. */
export const FIELD_ICON_CENTRE = EDGE + INSET + ICON / 2;

export type FieldFrameProps = {
  /** The quiet mark it leads with (a magnifier, a link, an envelope). */
  icon?: LucideIcon;
  /** Floating over the keyboard: white, lifted by a soft shadow. */
  raised?: boolean;
  /** What's in it can't be used: its edge goes amber — "not yet", never red. The page says why. */
  invalid?: boolean;
  /** From its end to what sits there, where that isn't text: a clear, a button. */
  endInset?: number;
  /** Its input, and anything after it. */
  children?: ReactNode;
  /** The frame's. */
  testID: string;
};

/**
 * Every one-line field and search bar's pill: at least 52 tall (larger text
 * grows it), a card's edge, its icon in the supporting grey. On the page it
 * takes the soft fill, so it reads against the white; floating over the
 * keyboard it's white on a soft shadow, as content scrolls behind it.
 */
export function FieldFrame({
  icon: Icon,
  raised = false,
  invalid = false,
  endInset = INSET,
  children,
  testID,
}: FieldFrameProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        {
          backgroundColor: raised ? theme.colors.background : theme.colors.surface,
          borderColor: invalid ? theme.colors.incorrect : theme.colors.containerBorder,
          gap: space[10],
          paddingLeft: INSET,
          paddingRight: endInset,
        },
        raised && { shadowColor: theme.colors.shadow, ...theme.elevation.floating },
      ]}
    >
      {Icon && (
        <Icon
          size={ICON}
          color={theme.colors.textSupporting}
          strokeWidth={theme.icon.strokeWidth}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    minHeight: controlHeight.field,
    borderWidth: EDGE,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
  },
});
