import type { Id } from "@/types/domain";
import type { StudyStepKey } from "../logic/study-steps";
import type { StudyDayContent } from "../types";
import { PrayStep } from "./PrayStep";
import { ReadStep } from "./ReadStep";
import { ReflectStep } from "./ReflectStep";
import { ScriptureStep } from "./ScriptureStep";

export type StudyStepBodyProps = {
  stepKey: StudyStepKey;
  /** The page within the step — which question, on Reflect. */
  page: number;
  content: StudyDayContent;
  answerFor: (reflectionId: Id) => string;
  onAnswerChange: (reflectionId: Id, answer: string) => void;
};

/** One Daily Study step's body, with the day's content for it. */
export function StudyStepBody({
  stepKey,
  page,
  content,
  answerFor,
  onAnswerChange,
}: StudyStepBodyProps) {
  const { day, scripture, reflections, prayer } = content;
  const reflection = reflections.at(page);

  switch (stepKey) {
    case "read":
      return (
        <ReadStep
          dayNumber={day.dayNumber}
          reading={day.reading}
          passageReference={scripture?.reference ?? ""}
        />
      );
    case "scripture":
      return scripture && <ScriptureStep dayNumber={day.dayNumber} passage={scripture} />;
    case "reflect":
      return (
        reflection && (
          <ReflectStep
            dayNumber={day.dayNumber}
            title={day.reading.title}
            reflection={reflection}
            total={reflections.length}
            answer={answerFor(reflection.id)}
            onAnswerChange={(answer) => onAnswerChange(reflection.id, answer)}
          />
        )
      );
    case "pray":
      return prayer && <PrayStep dayNumber={day.dayNumber} prayer={prayer} />;
  }
}
