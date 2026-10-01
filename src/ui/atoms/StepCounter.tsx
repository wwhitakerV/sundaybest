import { MonoBody } from "@/ui/typography/MonoBody";

export type StepCounterProps = {
  /** e.g. "1 of 2". */
  label: string;
};

/** The right-aligned step count in a flow header ("1 of 2"). */
export function StepCounter({ label }: StepCounterProps) {
  return (
    <MonoBody variant="counter" tone="chromeStepCounter">
      {label}
    </MonoBody>
  );
}
