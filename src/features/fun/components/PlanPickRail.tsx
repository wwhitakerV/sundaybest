import { ScrollView } from "react-native";

import { PAGE_INSET } from "@/ui/Screen";
import { useTheme } from "@/theme";
import GRACE_ARTWORK from "../../../../assets/images/fun/06_plan_thumbnail_grace.png";
import CHOOSE_TODAY_ARTWORK from "../../../../assets/images/fun/07_plan_thumbnail_choose_today.png";
import type { PlanPick } from "../hooks/use-plan-picks";
import { getPlanPickArtwork } from "../logic/plan-picks";
import { PLAN_PICK_CARD_WIDTH, PlanPickCard } from "./PlanPickCard";

/** A plan's days have no pictures of their own, so they take turns with these. */
const ARTWORKS = [CHOOSE_TODAY_ARTWORK, GRACE_ARTWORK] as const;

export type PlanPickRailProps = {
  picks: readonly PlanPick[];
  onOpenPick: (pick: PlanPick) => void;
  testID: string;
};

/** Days from the user's plans, in a row that runs edge to edge and scrolls sideways. */
export function PlanPickRail({ picks, onOpenPick, testID }: PlanPickRailProps) {
  const theme = useTheme();
  const gap = theme.spacing.sm;

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={PLAN_PICK_CARD_WIDTH + gap}
      contentContainerStyle={{ paddingHorizontal: PAGE_INSET, gap }}
    >
      {picks.map((pick) => (
        <PlanPickCard
          key={pick.dayId}
          testID={`${testID}-${pick.dayId}`}
          title={pick.title}
          reference={pick.reference}
          detail={pick.detail}
          artwork={getPlanPickArtwork(pick.dayNumber, ARTWORKS)}
          activities={pick.activities}
          onPress={() => onOpenPick(pick)}
        />
      ))}
    </ScrollView>
  );
}
