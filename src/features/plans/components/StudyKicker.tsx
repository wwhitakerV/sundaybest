import { StepKicker } from "@/entities/study";
import { StudyDriftIn } from "./StudyDriftIn";

export type StudyKickerProps = {
  dayNumber: number;
  /** The step or question: "Read", "Question 1 of 2". */
  label: string;
};

/** The small line over each Daily Study step, drifting in first: "Day 2  Read". */
export function StudyKicker({ dayNumber, label }: StudyKickerProps) {
  return (
    <StudyDriftIn order={0}>
      <StepKicker dayNumber={dayNumber} label={label} />
    </StudyDriftIn>
  );
}
