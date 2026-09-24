import type {
  BibleTranslation,
  IsoDate,
  IsoDateTime,
  Plan,
  PlanDay,
  PlanDayStatus,
  Prayer,
  Reflection,
  ScripturePassage,
  ScriptureVerse,
  SermonClip,
  StudyStep,
} from "@/types/domain";

/** One day of a mock plan, as written: its content and where the user is with it. */
export type MockDayInput = {
  dayNumber: number;
  title: string;
  status: PlanDayStatus;
  paragraphs: string[];
  sermonQuote: string;
  sermonClip: SermonClip;
  passage: {
    reference: string;
    book: string;
    chapter: number;
    verses: ScriptureVerse[];
  };
  reflections: { question: string; answer?: string; answeredAt?: IsoDateTime }[];
  prayer: { text: string; prayedAt?: IsoDateTime };
  completedSteps: StudyStep[];
  scheduledOn: IsoDate | null;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
};

/** A day and everything that hangs off it. */
export type MockDayRecords = {
  day: PlanDay;
  scripture: ScripturePassage;
  reflections: Reflection[];
  prayer: Prayer;
};

/** The latest of several moments (ISO strings sort by time). */
function latest(...moments: (IsoDateTime | null | undefined)[]): IsoDateTime {
  return (
    moments
      .filter((moment): moment is IsoDateTime => Boolean(moment))
      .sort()
      .at(-1) ?? ""
  );
}

/**
 * Builds a mock plan day's records from its input, with IDs derived from the
 * plan's (`<plan>-day-<n>`, `…-scripture`, `…-reflection-<n>`, `…-prayer`),
 * so every record points at the right one. Everything is created when the
 * plan finished building (`builtAt`) and updated as the user works through it.
 */
export function makeDayRecords(
  plan: Plan,
  builtAt: IsoDateTime,
  translation: BibleTranslation,
  input: MockDayInput,
): MockDayRecords {
  const dayId = `${plan.id}-day-${input.dayNumber}`;
  const { verses } = input.passage;
  const scripture: ScripturePassage = {
    id: `${dayId}-scripture`,
    createdAt: builtAt,
    updatedAt: builtAt,
    reference: input.passage.reference,
    book: input.passage.book,
    chapter: input.passage.chapter,
    verseStart: verses.at(0)?.number ?? 1,
    verseEnd: verses.at(-1)?.number ?? 1,
    translation,
    verses,
  };
  const reflections = input.reflections.map(
    ({ question, answer, answeredAt }, index): Reflection => ({
      id: `${dayId}-reflection-${index + 1}`,
      createdAt: builtAt,
      updatedAt: latest(builtAt, answeredAt),
      planDayId: dayId,
      order: index + 1,
      question,
      answer: answer ?? null,
      answeredAt: answeredAt ?? null,
    }),
  );
  const prayer: Prayer = {
    id: `${dayId}-prayer`,
    createdAt: builtAt,
    updatedAt: latest(builtAt, input.prayer.prayedAt),
    planDayId: dayId,
    title: "A prayer for today",
    text: input.prayer.text,
    prayedAt: input.prayer.prayedAt ?? null,
  };
  const day: PlanDay = {
    id: dayId,
    createdAt: builtAt,
    updatedAt: latest(builtAt, input.startedAt, input.completedAt),
    planId: plan.id,
    dayNumber: input.dayNumber,
    status: input.status,
    reading: {
      title: input.title,
      paragraphs: input.paragraphs,
      sermonQuote: input.sermonQuote,
      sermonClip: input.sermonClip,
    },
    scriptureId: scripture.id,
    completedSteps: input.completedSteps,
    scheduledOn: input.scheduledOn,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  };
  return { day, scripture, reflections, prayer };
}

export const ALL_STEPS: StudyStep[] = ["read", "scripture", "reflect", "pray"];
