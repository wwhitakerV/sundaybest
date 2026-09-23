import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useFadeTo } from "../../hooks/use-tap-feedback";
import { PRAYER_LINES, getPrayScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

/** Lines not yet prayed rest faintly, so the card is never blank. */
const RESTING_OPACITY = 0.22;
// The glow: concentric accent discs, faintest outermost.
// Sized to stay inside the lifted card, so nothing needs clipping.
const GLOW_RINGS = [
  { size: 170, opacity: 0.06 },
  { size: 120, opacity: 0.08 },
  { size: 76, opacity: 0.1 },
] as const;

function PrayerLine({ text, shown }: { text: string; shown: boolean }) {
  const theme = useTheme();
  const fadeStyle = useFadeTo(shown ? 1 : RESTING_OPACITY, 420);

  return (
    <Animated.Text style={[theme.typography.scripture, { color: theme.colors.text }, fadeStyle]}>
      {text}
    </Animated.Text>
  );
}

/**
 * The day's prayer. As its scene plays, a warm glow comes up behind it and
 * its lines come in one after another, as if being prayed.
 */
export function PrayerLines({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const scene = getPrayScene(elapsedMs);
  const glowStyle = useFadeTo(scene.glowing ? 1 : 0, 500);

  return (
    <View style={styles.lines}>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
        {GLOW_RINGS.map(({ size, opacity }) => (
          <View
            key={size}
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: theme.colors.accent,
                opacity,
              },
            ]}
          />
        ))}
      </Animated.View>
      {PRAYER_LINES.map((line, position) => (
        <PrayerLine key={line} text={line} shown={position < scene.shownLines} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lines: { paddingVertical: 4 },
  glow: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute" },
});
