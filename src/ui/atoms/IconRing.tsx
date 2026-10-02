import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";
import { HERO_RING } from "./hero-ring";

/** Its size and band: every hero ring's. */
const SIZE = HERO_RING.size;
const BAND = HERO_RING.band;
const ICON_SIZE = 56;

export type IconRingProps = {
  /** Drawn in the accent, as an outline, at the ring's centre. */
  icon: LucideIcon;
  /** It marks something done: its band in the accent, as a studied day's ring is. */
  done?: boolean;
  testID?: string;
};

/**
 * A large ring round a single accent icon: the head of a moment worth
 * marking. Its band is a soft grey, or the accent once something's done. Its
 * icon is always an outline — the one filled flame is Plan Complete's own.
 */
export function IconRing({ icon: Icon, done = false, testID }: IconRingProps) {
  const theme = useTheme();
  const band = done ? theme.colors.accent : theme.colors.segmentBackground;

  return (
    <View testID={testID} style={[styles.ring, { borderColor: band }]}>
      <Icon size={ICON_SIZE} color={theme.colors.accent} strokeWidth={theme.icon.strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: BAND,
    alignItems: "center",
    justifyContent: "center",
  },
});
