import type { ApiPlanDetail, ApiStudyDay } from "@/core/api/contracts";
import type { Standfirst } from "./plan-library";
import { STUDY_STEPS, type StudyStepKey } from "./study-steps";

type PlanDay = ApiPlanDetail["days"][number];

/** The day a plan's on, while it's open to study — none once it's done, or while it waits to open. */
export function openDayOf(plan: ApiPlanDetail): PlanDay | null {
  if (plan.status === "completed") return null;
  const number = plan.progress.currentDayNumber ?? 1;
  const day = plan.days.find((candidate) => candidate.dayNumber === number);
  const status = day?.progress.status;
  return day && status !== "locked" && status !== "completed" ? day : null;
}

/** The step a day goes on with: its first study step not done, then its Quick Check, if it has one still to take. */
export function nextStepOf(day: PlanDay): StudyStepKey | "quickCheck" | null {
  const step = STUDY_STEPS.find(({ key }) => !day.progress.completedSteps.includes(key));
  if (step) return step.key;
  return day.quickCheck && day.quickCheck.status !== "completed" ? "quickCheck" : null;
}

/**
 * The step waiting, in its own words, led by its name: the teaching's first
 * sentence; the passage's first verse, quoted (its reference until the
 * day's Scripture is here); the first question to reflect on; the prayer's
 * first sentence; or what the Quick Check holds — never its questions.
 * `verses` is the day's Scripture, once fetched.
 */
export function describeNextStep(
  day: PlanDay,
  verses: ApiStudyDay["scripture"]["verses"] | null,
): Standfirst | null {
  switch (nextStepOf(day)) {
    case "read": {
      const opening = day.reading.paragraphs[0]?.content;
      return opening
        ? { lead: "Read", now: true, text: firstSentence(opening), quoted: false }
        : null;
    }
    case "scripture": {
      const verse = verses?.[0]?.text;
      return verse
        ? { lead: "Scripture", now: true, text: verse.trim(), quoted: true }
        : { lead: "Scripture", now: true, text: day.scriptureReference.reference, quoted: false };
    }
    case "reflect": {
      const prompt = [...day.reflectionPrompts].sort((a, b) => a.order - b.order)[0];
      return prompt ? { lead: "Reflect", now: true, text: prompt.question, quoted: false } : null;
    }
    case "pray":
      return { lead: "Pray", now: true, text: firstSentence(day.prayer.text), quoted: false };
    case "quickCheck": {
      const count = day.quickCheck?.questionCount ?? 0;
      const holds =
        count > 0 ? `${count} ${count === 1 ? "question" : "questions"}` : "A few questions";
      return { lead: "Quick Check", now: true, text: `${holds} on today's study.`, quoted: false };
    }
    case null:
      return null;
  }
}

/** A passage's first sentence — the whole of it when it has no full stop to end on. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  return /^[\s\S]*?[.!?](?=\s|$)/.exec(trimmed)?.[0] ?? trimmed;
}
