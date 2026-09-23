import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type TitleHeaderProps = {
  /** Rendered in the `screenTitle` role, left-aligned. */
  title: string;
  /** Right slot — typically one or more borderless `HeaderIconButton`s. */
  actions?: ReactNode;
};

/** A tab root's header row: large left-aligned title, actions on the right. */
export function TitleHeader({ title, actions }: TitleHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
