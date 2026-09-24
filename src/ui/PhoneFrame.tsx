import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BatteryFull, Signal, Wifi } from "lucide-react-native";

import { useTheme } from "@/theme";

/** The drawn screen is a 393×852pt iPhone (the app's layout baseline). */
const SCREEN_WIDTH = 393;
const SCREEN_HEIGHT = 852;
const BEZEL = 12;
const SCREEN_RADIUS = 50;

// One-off device chrome, drawn to match iOS rather than the app's own type
// scale: the status bar is the system's, not ours.
const STATUS_BAR_HEIGHT = 54;

/** Outer size of a `PhoneFrame`, bezel included — what a scaler scales. */
export const PHONE_FRAME = {
  /** The content area inside the bezel, below the status bar — where a screen is laid out. */
  contentTop: BEZEL + STATUS_BAR_HEIGHT,
  contentWidth: SCREEN_WIDTH,
  contentHeight: SCREEN_HEIGHT - STATUS_BAR_HEIGHT,
  width: SCREEN_WIDTH + BEZEL * 2,
  height: SCREEN_HEIGHT + BEZEL * 2,
  radius: SCREEN_RADIUS + BEZEL,
} as const;

const STATUS_TIME_STYLE = { fontSize: 17, fontWeight: "600" } as const;
const STATUS_ICON_SIZE = 18;
const ISLAND = { width: 125, height: 37, top: 11 } as const;

export type PhoneFrameProps = {
  /** The screen's content, laid out below the status bar at real iPhone size. */
  children?: ReactNode;
  testID?: string;
};

/**
 * An iPhone drawn in code — bezel, rounded screen, status bar, and camera
 * island — at real size (see `PHONE_FRAME`). Content is laid out exactly as
 * on a device, so a mock screen is just a screen; shrink it with
 * `ScaledView`. Purely presentational.
 */
export function PhoneFrame({ children, testID }: PhoneFrameProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.frame, { backgroundColor: theme.colors.deviceFrame }]}>
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <View style={styles.statusBar}>
          <Text style={[STATUS_TIME_STYLE, { color: theme.colors.text }]}>9:41</Text>
          <View style={styles.statusIcons}>
            <Signal size={STATUS_ICON_SIZE} color={theme.colors.text} strokeWidth={2.5} />
            <Wifi size={STATUS_ICON_SIZE} color={theme.colors.text} strokeWidth={2.5} />
            <BatteryFull size={STATUS_ICON_SIZE + 6} color={theme.colors.text} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.content}>{children}</View>
        <View style={[styles.island, { backgroundColor: theme.colors.deviceFrame }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: PHONE_FRAME.width,
    height: PHONE_FRAME.height,
    borderRadius: PHONE_FRAME.radius,
    padding: BEZEL,
  },
  screen: {
    flex: 1,
    borderRadius: SCREEN_RADIUS,
    overflow: "hidden",
  },
  statusBar: {
    height: STATUS_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 34,
    paddingTop: 6,
  },
  statusIcons: { flexDirection: "row", alignItems: "center", gap: 6 },
  content: { flex: 1 },
  island: {
    position: "absolute",
    top: ISLAND.top,
    left: (SCREEN_WIDTH - ISLAND.width) / 2,
    width: ISLAND.width,
    height: ISLAND.height,
    borderRadius: ISLAND.height / 2,
  },
});
