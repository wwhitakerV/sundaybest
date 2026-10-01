import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { controlHeight } from "@/theme";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type TitleHeaderProps = {
  /** Rendered in the `screenTitle` role, left-aligned. */
  title: string;
  /** Right slot — typically one or more borderless `HeaderIconButton`s. */
  actions?: ReactNode;
};

/** A header action's 44pt tap target: the row keeps it, with or without one, so the page below never shifts. */
const MIN_HEIGHT = controlHeight.hitTarget;

/** A tab root's header row: large left-aligned title, actions on the right. */
export function TitleHeader({ title, actions }: TitleHeaderProps) {
  return (
    <View testID="title-header" style={styles.row}>
      <SFProTitle>{title}</SFProTitle>
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
