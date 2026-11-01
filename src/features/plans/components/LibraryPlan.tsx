import { Pressable, StyleSheet, View } from "react-native";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { DayMarks, FEATURE_ARTWORK_RADIUS } from "@/entities/plan";
import { space } from "@/theme";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { useLibraryPlan } from "../hooks/use-library-plan";

/** A title on the shelf, at most this long: two lines, read at a glance. */
const TITLE_LINES = 2;

export type LibraryPlanProps = { plan: ApiPlanSummary };

/**
 * One plan on a library shelf, as a publication is kept: its artwork the
 * page's width, 16:9, and under it, with nothing round it, its folio (its
 * church and Scripture, as the lead's), its title in the editorial face
 * with its series small and grey under it, and — unfinished — its days, led by "DAY": those done in ink, the rest
 * faint, never the accent, which is the lead's alone. Tapped anywhere, it
 * opens.
 */
export function LibraryPlan({ plan }: LibraryPlanProps) {
  const entry = useLibraryPlan(plan);
  return (
    <Pressable
      testID={`plans-shelf-${plan.id}`}
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      accessibilityHint="Opens the plan"
      onPress={entry.open}
      style={styles.entry}
    >
      <VideoThumbnail uri={entry.thumbnailUrl} style={styles.artwork} />
      <View style={styles.words}>
        <MonoLabel
          variant="labelTracked"
          tone="textSupporting"
          testID={`plans-shelf-${plan.id}-folio`}
        >
          {entry.folio}
        </MonoLabel>
        <SFProTitle variant="offer" numberOfLines={TITLE_LINES}>
          {entry.title}
        </SFProTitle>
        {entry.series && (
          <SFProBody variant="rowDetail" tone="textSupporting" testID={`plans-shelf-${plan.id}-series`}>
            {entry.series}
          </SFProBody>
        )}
        {entry.days && (
          <DayMarks
            testID={`plans-shelf-${plan.id}-days`}
            total={entry.days.total}
            done={entry.days.done}
            labelled
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Its room below it: what sets one plan apart from the next.
  entry: { gap: space[16], paddingBottom: space[24] },
  artwork: { width: "100%", aspectRatio: 16 / 9, borderRadius: FEATURE_ARTWORK_RADIUS },
  words: { gap: space[8] },
});
