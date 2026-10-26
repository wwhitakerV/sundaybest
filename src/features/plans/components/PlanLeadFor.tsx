import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { usePlanDetail } from "../hooks/use-plan-detail";
import { PlanLead } from "./PlanLead";
import { PlanPageSkeleton } from "./PlanPageSkeleton";

export type PlanLeadForProps = { planId: string; testID: string };

/**
 * A plan's lead (`PlanLead`) on a page that isn't Plans' (Formation): the
 * plan by its id, in its page's skeleton while it loads.
 */
export function PlanLeadFor({ planId, testID }: PlanLeadForProps) {
  const plan = usePlanDetail(planId);
  return (
    <SkeletonHandoff
      testID={`${testID}-handoff`}
      pending={!plan.found && plan.loading}
      skeleton={<PlanPageSkeleton testID={`${testID}-pending`} />}
    >
      <PlanLead plan={plan} testID={testID} />
    </SkeletonHandoff>
  );
}
