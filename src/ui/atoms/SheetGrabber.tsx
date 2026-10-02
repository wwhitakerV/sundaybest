import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/** iOS's own sheet grabber, drawn to match it. */
const GRABBER = { width: 40, height: 5, radius: 3 } as const;

/** The drag indicator centred at the top of a sheet. */
export function SheetGrabber({ testID }: { testID?: string }) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.grabber, { backgroundColor: theme.colors.grabber }]} />
  );
}

const styles = StyleSheet.create({
  grabber: {
    alignSelf: "center",
    width: GRABBER.width,
    height: GRABBER.height,
    borderRadius: GRABBER.radius,
  },
});
