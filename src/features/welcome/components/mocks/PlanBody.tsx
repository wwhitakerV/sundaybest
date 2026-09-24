import { StyleSheet, Text, View } from "react-native";
import { Check, Link2 } from "lucide-react-native";

import { useTheme } from "@/theme";
import { PASTE_LINK, getLiftElapsedMs } from "../../logic/scenes";
import { getLiftsFor } from "../../logic/story";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../lift/lift-anchor-context";
import { PlanSetup } from "../lifts/PlanSetup";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE, type MockBodyProps } from "./mock-page";
import { SermonCard } from "./SermonCard";

const PLAN_LIFTS = getLiftsFor("plan");
/** Between "How many days?" and the days. */
const SETUP_LABEL_GAP = 24;

/**
 * New Plan's second step, rising into place top to bottom: the pasted link,
 * the sermon it points to, "How many days?", then the days and "Create my
 * plan", which lift off together: a day is picked, then the button is
 * pressed.
 */
export function PlanBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <View
          style={[
            styles.link,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
          ]}
        >
          <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
          <Text
            numberOfLines={1}
            style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}
          >
            …/{PASTE_LINK.split("/").at(-1)}
          </Text>
          <View style={[styles.linkCheck, { backgroundColor: theme.colors.segmentBackground }]}>
            <Check size={20} color={theme.colors.selected} strokeWidth={2.5} />
          </View>
        </View>
      </FadeUp>

      <FadeUp order={1} still={still}>
        <SermonCard />
      </FadeUp>

      <FadeUp order={2} still={still}>
        <View style={styles.setup}>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            How many days?
          </Text>
          <LiftAnchor id={getLiftId("plan", 0)}>
            <PlanSetup elapsedMs={getLiftElapsedMs(elapsedMs, PLAN_LIFTS, 0)} />
          </LiftAnchor>
        </View>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    height: 64,
    borderWidth: 1,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  grow: { flex: 1 },
  linkCheck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  // Sets "How many days?" and the days apart from the sermon above them, and
  // gives the label room above its days.
  setup: { marginTop: 18, gap: SETUP_LABEL_GAP },
});
