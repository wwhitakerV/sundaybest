import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { BatteryFull, Signal, Wifi } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { PHONE_FRAME, PHONE_SCREEN } from "../logic/phone-frame";

const {
  width: SCREEN_WIDTH,
  bezel: BEZEL,
  radius: SCREEN_RADIUS,
  statusBarHeight: STATUS_BAR_HEIGHT,
} = PHONE_SCREEN;

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
          <SFProLabel variant="statusTime">9:41</SFProLabel>
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

/** The status bar's clock and icons sit this far in, as on an iPhone. */
const STATUS_BAR_INSET = 34;

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
    paddingHorizontal: STATUS_BAR_INSET,
    paddingTop: space[6],
  },
  statusIcons: { flexDirection: "row", alignItems: "center", gap: space[6] },
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
