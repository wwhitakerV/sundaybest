import { Pressable, StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/theme";

/** The corner-scale steps a card takes (`radius` in `@/theme`). */
type CardRadius = 24 | 28 | 32 | 36;

export type CardProps = ViewProps & {
  /** Its corners: 28 for most cards, 24 for a tighter one, 32 or 36 for a larger one. */
  radius?: CardRadius;
  /** `surface`, the soft fill (the default); or `page`, the page's own background colour. */
  fill?: "surface" | "page";
  /** Makes the whole card one button; name it with `accessibilityLabel`. */
  onPress?: () => void;
  /** Its container edge — drawn unless asked for none, for a card that sits on its fill alone. */
  edge?: boolean;
};

/**
 * The app's card: the container edge (`containerBorder`) round a soft fill.
 * Padding and gap come in through `style`, from the spacing scale. With
 * `onPress` the whole of it is a button.
 */
export function Card({
  radius = 28,
  fill = "surface",
  edge = true,
  style,
  onPress,
  ...props
}: CardProps) {
  const theme = useTheme();
  const shell = [
    edge ? styles.edge : styles.edgeless,
    {
      borderRadius: radius,
      backgroundColor: fill === "page" ? theme.colors.background : theme.colors.surface,
      borderColor: theme.colors.containerBorder,
    },
    style,
  ];

  if (onPress) {
    return <Pressable {...props} accessibilityRole="button" onPress={onPress} style={shell} />;
  }
  return <View {...props} style={shell} />;
}

const styles = StyleSheet.create({
  edge: { borderWidth: 1 },
  edgeless: { borderWidth: 0 },
});
