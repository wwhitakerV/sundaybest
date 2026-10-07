import { StepKicker } from "@/entities/study";
import { StudyEnter } from "./StudyEnter";

export type StudyKickerProps = {
  dayNumber: number;
  /** The step or question: "Read", "Question 1 of 2". */
  label: string;
};

/** The small line over each Daily Study step, entering first: "Day 2  Read". */
export function StudyKicker({ dayNumber, label }: StudyKickerProps) {
  return (
    <StudyEnter order={0}>
      <StepKicker dayNumber={dayNumber} label={label} />
    </StudyEnter>
  );
}
