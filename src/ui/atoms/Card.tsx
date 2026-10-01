import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/theme";

/** The corner-scale steps a card takes (`radius` in `@/theme`). */
type CardRadius = 24 | 28 | 32 | 36;

export type CardProps = ViewProps & {
  /** Its corners: 28 for most cards, 24 for a tighter one, 32 or 36 for a larger one. */
  radius?: CardRadius;
  /** `surface`, the soft fill (the default); or `page`, the page's own background colour. */
  fill?: "surface" | "page";
};

/**
 * The app's card: a hairline edge round a soft fill. Padding and gap come in
 * through `style`, from the spacing scale.
 */
export function Card({ radius = 28, fill = "surface", style, ...props }: CardProps) {
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          borderRadius: radius,
          backgroundColor: fill === "page" ? theme.colors.background : theme.colors.surface,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
});
