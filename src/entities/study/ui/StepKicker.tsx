import { formatDay } from "@/entities/plan";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

export type StepKickerProps = {
  dayNumber: number;
  /** The step or question: "Read", "Question 1 of 2". */
  label: string;
  testID?: string;
};

/** The small line over each Daily Study step: "Day 2  Read". */
export function StepKicker({ dayNumber, label, testID }: StepKickerProps) {
  return (
    <MonoLabel testID={testID}>
      {`${formatDay(dayNumber)}  `}
      <Span tone="textMuted">{label}</Span>
    </MonoLabel>
  );
}
