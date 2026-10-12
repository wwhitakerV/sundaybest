import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";

import { cardStyle, useTheme, type CardRole } from "@/theme";

export type CardProps = ViewProps & {
  /**
   * What it holds, which sets its corners and the room inside it (`cardStyle`):
   * `list` (rows), `content` (the default: a block to read or act on), or
   * `feature` (a page's one big card).
   */
  kind?: CardRole;
  /** The room inside, from its kind — off for a picture to its edges, or rows laid out their own way. */
  inset?: boolean;
  /** `surface`, the soft fill (the default); or `page`, the page's own background colour. */
  fill?: "surface" | "page";
  /** Makes the whole card one button; name it with `accessibilityLabel`. */
  onPress?: () => void;
  /** Its container edge — drawn unless asked for none, for a card that sits on its fill alone. */
  edge?: boolean;
  /** How it grows and shrinks when what's in it changes size (a row opening): it springs, not jumps. */
  layout?: ComponentProps<typeof Animated.View>["layout"];
};

/**
 * The app's card: the container edge (`containerBorder`) round a soft fill,
 * its corners and the room inside it set by its kind, so every card of a kind
 * matches. Its gap and layout come in through `style`. With `onPress` the
 * whole of it is a button.
 */
export function Card({
  kind = "content",
  inset = true,
  fill = "surface",
  edge = true,
  style,
  onPress,
  layout,
  ...props
}: CardProps) {
  const theme = useTheme();
  const shell = [
    edge ? styles.edge : styles.edgeless,
    {
      borderRadius: cardStyle[kind].radius,
      ...(inset && { padding: cardStyle[kind].inset }),
      backgroundColor: fill === "page" ? theme.colors.background : theme.colors.surface,
      borderColor: theme.colors.containerBorder,
    },
    style,
  ];

  if (onPress) {
    return <Pressable {...props} accessibilityRole="button" onPress={onPress} style={shell} />;
  }
  if (layout) return <Animated.View {...props} layout={layout} style={shell} />;
  return <View {...props} style={shell} />;
}

const styles = StyleSheet.create({
  edge: { borderWidth: 1 },
  edgeless: { borderWidth: 0 },
});
