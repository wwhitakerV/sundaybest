import { ArrowLeft, X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";

export type PlanCreationHeaderProps = {
  /** "close" for the flow's first screen or a temporary step; "back" to move within the flow. */
  leading: "close" | "back";
  onPress: () => void;
  /** Context line, e.g. "1 of 2". Omitted on screens with no step count. */
  step?: string;
  testID: string;
};

/** Shared by every screen in the plan-creation modal flow: X or Back, "New plan", and a step count. */
export function PlanCreationHeader({ leading, onPress, step, testID }: PlanCreationHeaderProps) {
  const Icon = leading === "close" ? X : ArrowLeft;
  const label = leading === "close" ? "Close" : "Back";

  return (
    <ScreenHeader
      testID={testID}
      title="New plan"
      left={
        <HeaderIconButton
          testID={`${testID}-${leading}-button`}
          icon={Icon}
          accessibilityLabel={label}
          onPress={onPress}
        />
      }
      right={step !== undefined ? <StepCounter label={step} /> : undefined}
    />
  );
}
