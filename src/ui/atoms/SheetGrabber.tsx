import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/**
 * Every sheet's grabber, the app's own on all of them (iOS's is switched
 * off): 8pt wider than it was, so it reads as a handle.
 */
export const SHEET_GRABBER = { width: 48, height: 5, radius: 3 } as const;
const GRABBER = SHEET_GRABBER;

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
