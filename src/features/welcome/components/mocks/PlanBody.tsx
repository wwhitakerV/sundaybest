import { StyleSheet, View } from "react-native";
import { Check, Link2 } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { PASTE_LINK, getLiftElapsedMs } from "../../logic/scenes";
import { getLiftsFor } from "../../logic/story";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../../logic/lift";
import { PlanSetup } from "../lifts/PlanSetup";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE } from "./mock-page-styles";
import type { MockBodyProps } from "../../logic/mock-page";
import { SermonCard } from "./SermonCard";
import { SFProBody } from "@/ui/typography/SFProBody";

const PLAN_LIFTS = getLiftsFor("plan");
/** Between "How many days?" and the days. */
const SETUP_LABEL_GAP = space[24];

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
        <Card radius={32} fill="page" style={styles.link}>
          <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
          <SFProBody style={styles.grow} numberOfLines={1}>
            …/{PASTE_LINK.split("/").at(-1)}
          </SFProBody>
          <View style={[styles.linkCheck, { backgroundColor: theme.colors.segmentBackground }]}>
            <Check size={20} color={theme.colors.selected} strokeWidth={2.5} />
          </View>
        </Card>
      </FadeUp>

      <FadeUp order={1} still={still}>
        <SermonCard />
      </FadeUp>

      <FadeUp order={2} still={still}>
        <View style={styles.setup}>
          <SFProBody tone="textMuted">How many days?</SFProBody>
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
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: space[20],
    paddingRight: space[8],
    gap: space[12],
  },
  grow: { flex: 1 },
  linkCheck: {
    width: 46,
    height: 46,
    borderRadius: radius[23],
    alignItems: "center",
    justifyContent: "center",
  },
  // Sets "How many days?" and the days apart from the sermon above them, and
  // gives the label room above its days.
  setup: { marginTop: space[18], gap: SETUP_LABEL_GAP },
});
