import { Flame } from "lucide-react-native";

import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { Button } from "@/ui/atoms/Button";
import { IconRing } from "@/ui/atoms/IconRing";
import { formatPlanLength } from "@/entities/plan";
import { ReminderTimes } from "../components/ReminderTimes";
import { usePlanReady } from "../hooks/use-plan-ready";

/**
 * Plan Ready: the plan just built, how long it runs and what it's from, a
 * morning reminder to pick, then Start day 1 (which starts the plan) or Not
 * now (it waits in Your plans). A milestone page (`MilestoneScreen`).
 */
export function PlanReadyScreen() {
  const { plan, reminder, selectTime, start, notNow } = usePlanReady();

  return (
    <MilestoneScreen
      testID="plan-ready-screen"
      mark={<IconRing icon={Flame} />}
      title="Your plan is ready"
      {...(plan && { subtitle: `${formatPlanLength(plan.lengthDays)} from ${plan.title}` })}
      footer={
        <>
          <Button
            testID="plan-ready-start-button"
            label="Start day 1"
            onPress={() => void start()}
          />
          <Button
            testID="plan-ready-not-now-button"
            label="Not now"
            variant="secondary"
            onPress={notNow}
          />
        </>
      }
    >
      <ReminderTimes
        testID="plan-ready-reminder"
        selected={reminder?.enabled ? reminder.time : null}
        onSelect={selectTime}
      />
    </MilestoneScreen>
  );
}
