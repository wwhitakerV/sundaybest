import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Droplet, Flame } from "lucide-react-native";

import { space, useTheme } from "@/theme";

/** The warm glow behind the flame, and the flame within it. */
const GLOW = 260;
const FLAME = 120;
/** The three sparks rising off it: small, larger in the middle. */
const SPARKS = [16, 22, 16] as const;

/**
 * The finish's flame: large, in the accent, on a soft glow of its own colour,
 * three sparks rising off it.
 */
export function PlanCompleteFlame({ testID }: { testID?: string }) {
  const theme = useTheme();
  const accent = theme.colors.accent;

  return (
    <View testID={testID} style={styles.box}>
      <Svg width={GLOW} height={GLOW} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="plan-complete-glow" cx="50%" cy="50%" r="50%">
            <Stop offset={0} stopColor={accent} stopOpacity={0.2} />
            <Stop offset={1} stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#plan-complete-glow)" />
      </Svg>
      <View style={styles.sparks}>
        {SPARKS.map((size, index) => (
          <Droplet
            key={index}
            size={size}
            color={accent}
            fill={accent}
            strokeWidth={theme.icon.strokeWidth}
            style={index === 1 ? styles.middleSpark : styles.sideSpark}
          />
        ))}
      </View>
      <Flame size={FLAME} color={accent} fill={accent} strokeWidth={theme.icon.strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: GLOW, height: GLOW, alignItems: "center", justifyContent: "center" },
  sparks: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space[14],
    marginBottom: space[8],
  },
  // The middle spark hangs a little lower than the two beside it, nearer the flame.
  middleSpark: { marginTop: space[8] },
  sideSpark: { marginTop: 0 },
});
