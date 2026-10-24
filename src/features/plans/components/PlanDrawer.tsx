import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { iconSize, space, useTheme } from "@/theme";
import { Collapse } from "@/ui/atoms/Collapse";
import { SerifTitle } from "@/ui/typography/SerifTitle";

export type PlanDrawerProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  testID: string;
};

/**
 * One drawer of a plan's page, as a magazine sets a section: a hairline over
 * it, its heading in the serif with a chevron saying which way it goes, and
 * — opened — what it holds, rolling down beneath; closed, rolling up away.
 */
export function PlanDrawer({ title, open, onToggle, children, testID }: PlanDrawerProps) {
  const { colors, icon } = useTheme();
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View testID={testID} style={[styles.drawer, { borderTopColor: colors.divider }]}>
      <Pressable
        testID={`${testID}-toggle`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        onPress={onToggle}
        style={styles.heading}
      >
        <SerifTitle variant="heading" style={styles.title}>
          {title}
        </SerifTitle>
        <Chevron
          size={iconSize.chevron}
          color={colors.textSupporting}
          strokeWidth={icon.strokeWidth}
        />
      </Pressable>
      <Collapse open={open}>
        <View style={styles.body}>{children}</View>
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: { borderTopWidth: StyleSheet.hairlineWidth },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
    paddingVertical: space[20],
  },
  title: { flexShrink: 1 },
  body: { paddingBottom: space[24] },
});
