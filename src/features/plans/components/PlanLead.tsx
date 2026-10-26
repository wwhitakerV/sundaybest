import { StyleSheet, View } from "react-native";

import { PlanFeature, type FeaturePart } from "@/entities/plan";
import { space } from "@/theme";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { type usePlanDetail } from "../hooks/use-plan-detail";
import { DayCarousel } from "./DayCarousel";

type PlanDetail = ReturnType<typeof usePlanDetail>;

export type PlanLeadProps = {
  plan: PlanDetail;
  /** Continue as the page moves it — handed over to the tab bar on Plans. */
  action?: FeaturePart & { shown?: boolean };
  /** A finger on its days, and off: on Plans, the plans don't turn while one is. */
  onTouchingDays?: (touching: boolean) => void;
  testID: string;
};

/**
 * A plan's lead, as the top of its page on Plans sets it: the plan featured
 * as Home features one (`PlanFeature`), then its days, always in view, swiped
 * through (`DayCarousel`). From here the only way on is into a day's study.
 */
export function PlanLead({ plan, action, onTouchingDays, testID }: PlanLeadProps) {
  if (!plan.found || !plan.feature) return null;
  return (
    <View style={styles.lead}>
      <PlanFeature
        plan={plan.feature}
        onContinue={plan.openCurrentDay}
        {...(action && { action })}
        testIDs={{
          root: `${testID}-feature`,
          title: `${testID}-title`,
          standing: `${testID}-standing`,
          today: `${testID}-today`,
          action: `${testID}-continue`,
        }}
      />
      <View style={styles.bleed}>
        <DayCarousel
          testID={`${testID}-days`}
          days={plan.dayCards}
          currentDayNumber={plan.selectedNumber}
          onOpenDay={plan.openDay}
          onTouching={onTouchingDays ?? NO_TOUCH}
        />
      </View>
    </View>
  );
}

const NO_TOUCH = () => undefined;

const styles = StyleSheet.create({
  lead: { gap: space[32] },
  // The days run to the screen's edges, their first card set at the page's inset.
  bleed: { marginHorizontal: -PAGE_INSET },
});
