import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type TitleHeaderProps = {
  /** Rendered in the `screenTitle` role, left-aligned. */
  title: string;
  /** Right slot — typically one or more borderless `HeaderIconButton`s. */
  actions?: ReactNode;
};

/** A header button's height: the row keeps it, with or without one, so the page below never shifts. */
const MIN_HEIGHT = 44;

/** A tab root's header row: large left-aligned title, actions on the right. */
export function TitleHeader({ title, actions }: TitleHeaderProps) {
  const theme = useTheme();

  return (
    <View testID="title-header" style={styles.row}>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
