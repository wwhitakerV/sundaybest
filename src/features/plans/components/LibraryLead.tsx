import { Pressable, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { PlanIssue } from "@/entities/plan";
import { space } from "@/theme";
import { useLibraryLead } from "../hooks/use-library-lead";
import { LibrarySkeleton } from "./LibrarySkeleton";

export type LibraryLeadProps = {
  plan: ApiPlanSummary;
  /** The library's scroll, and where its header ends: Continue hands over to the tab bar out of view. */
  scrolled: SharedValue<number>;
  headerFoot: SharedValue<number>;
};

/**
 * The plan My studies leads with, featured as an issue (`PlanIssue`). Its
 * artwork opens the plan; Continue, its day.
 */
export function LibraryLead({ plan, scrolled, headerFoot }: LibraryLeadProps) {
  const lead = useLibraryLead(plan, scrolled, headerFoot);
  return (
    <View testID="plans-lead" style={styles.lead}>
      {lead.issue ? (
        <PlanIssue
          testID="plans-lead-issue"
          plan={lead.issue}
          onContinue={lead.openCurrentDay}
          frameArtwork={(artwork) => (
            <Pressable
              testID="plans-lead-artwork"
              accessibilityRole="button"
              accessibilityLabel={plan.title}
              accessibilityHint="Opens the plan"
              onPress={lead.open}
            >
              {artwork}
            </Pressable>
          )}
          action={lead.continuePlace}
        />
      ) : (
        <LibrarySkeleton testID="plans-lead-pending" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Its room below it, before More studies opens.
  lead: { paddingBottom: space[16] },
});
