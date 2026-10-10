import { useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

/** A pill's height: a full tap target. */
const PILL_HEIGHT = controlHeight.hitTarget;
/** Its icon, beside its words. */
const ICON = 16;
/** The line from the card down into each pill: short, and firm enough to read as holding it. */
const LINK = 12;
const LINE = 2;

export type ModuleAction = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
};

export type ModuleActionsProps = {
  /** The first way on. */
  primary: ModuleAction;
  /** Beside it, on its right — when there's a second. */
  secondary?: ModuleAction;
};

/**
 * What a module leads to, hung from its card: a pill, or two side by side, a
 * short line coming down from the card's foot into the middle of each — pills
 * in the card's own fill and edge, each its icon and words.
 */
export function ModuleActions({ primary, secondary }: ModuleActionsProps) {
  const theme = useTheme();
  // Where each pill's middle is, for its line to come down into it.
  const [middles, setMiddles] = useState<readonly [number | null, number | null]>([null, null]);
  const measure = (at: 0 | 1) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setMiddles((current) => (at === 0 ? [x + width / 2, current[1]] : [current[0], x + width / 2]));
  };

  return (
    <View style={{ paddingTop: LINK }}>
      {middles.map((middle, at) =>
        middle === null ? null : (
          <View
            // One line a pill, in its place: its order is its identity.
            key={`link-${at}`}
            style={[
              styles.link,
              // A step firmer than the card's edge, so it reads as holding the pill.
              { left: middle - LINE / 2, backgroundColor: theme.colors.borderStrong },
            ]}
          />
        ),
      )}
      <View style={[styles.row, { gap: space[10] }]}>
        <View onLayout={measure(0)}>
          <Pill {...primary} />
        </View>
        {secondary && (
          <View onLayout={measure(1)}>
            <Pill {...secondary} />
          </View>
        )}
      </View>
    </View>
  );
}

/** One way on: a pill in the card's fill and edge, its icon and its words. */
function Pill({ label, icon: Icon, onPress, disabled = false, testID }: ModuleAction) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pill,
        {
          gap: space[8],
          paddingHorizontal: space[16],
          borderRadius: radius.pill,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.containerBorder,
        },
      ]}
    >
      <Icon size={ICON} color={theme.colors.text} strokeWidth={theme.icon.strokeWidthStrong} />
      <SFProBody variant="label">{label}</SFProBody>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // From the card's foot down to the pill's top edge.
  link: { position: "absolute", top: 0, width: LINE, height: LINK },
  row: { flexDirection: "row", justifyContent: "center" },
  pill: { height: PILL_HEIGHT, borderWidth: 1, flexDirection: "row", alignItems: "center" },
});
