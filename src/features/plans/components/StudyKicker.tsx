import { StudyDriftIn } from "./StudyDriftIn";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

export type StudyKickerProps = {
  dayNumber: number;
  /** The step or question: "Read", "Question 1 of 2". */
  label: string;
};

/** The small line over each Daily Study step: "Day 2  Read". */
export function StudyKicker({ dayNumber, label }: StudyKickerProps) {
  return (
    <StudyDriftIn order={0}>
      <MonoLabel>
        {`Day ${dayNumber}  `}
        <Span tone="textMuted">{label}</Span>
      </MonoLabel>
    </StudyDriftIn>
  );
}
