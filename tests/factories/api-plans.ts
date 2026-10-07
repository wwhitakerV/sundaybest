import {
  planDetailSchema,
  planSummarySchema,
  quizSessionResponseSchema,
  studyDaySchema,
  type ApiPlanDetail,
  type ApiPlanSummary,
  type ApiStudyDay,
} from "@/core/api/contracts";
import { aSermon } from "./api";

/**
 * Plans as the API serves them, for screens and hooks that read the real API
 * through MSW. Every builder parses its result with the app's own contract, so
 * a fixture that no longer matches the API fails here, loudly, rather than
 * passing a test it shouldn't.
 */

const NOW = "2026-10-05T12:00:00.000Z";
const STEPS = ["read", "scripture", "reflect", "pray"] as const;

type PlanDay = ApiPlanDetail["days"][number];
type DayStatus = PlanDay["progress"]["status"];
type Step = (typeof STEPS)[number];

/** A stable UUID from a number: `uuid(1)` is always the same id. */
export function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

/** The ids a plan's parts get, from its seed: none collide across plans with different seeds. */
const ids = (seed: number) => ({
  plan: uuid(seed * 1000),
  sermon: uuid(seed * 1000 + 1),
  day: (dayNumber: number) => uuid(seed * 1000 + dayNumber * 10),
  scripture: (dayNumber: number) => uuid(seed * 1000 + dayNumber * 10 + 1),
  reflection: (dayNumber: number, order: number) => uuid(seed * 1000 + dayNumber * 10 + 1 + order),
  prayer: (dayNumber: number) => uuid(seed * 1000 + dayNumber * 10 + 5),
  quiz: (dayNumber: number) => uuid(seed * 1000 + dayNumber * 10 + 6),
});

export type PlanOptions = {
  /** Keeps ids distinct between plans in one test: 1, 2, 3… */
  seed?: number;
  title?: string;
  church?: string | null;
  status?: "ready" | "active" | "completed" | "archived";
  lengthDays?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Days done, in order. A completed plan has them all. */
  completedDays?: number;
  /** The day the plan's on: its status (default "available"), and the steps done in it. */
  currentDayStatus?: DayStatus;
  currentDaySteps?: readonly Step[];
  quickCheckEnabled?: boolean;
  /** How far the current day's Quick Check has got, when it has one. */
  quickCheck?: {
    status: "notStarted" | "inProgress" | "completed";
    answered?: number;
    correct?: number;
  };
  saved?: boolean;
  isSample?: boolean;
  /** The plan's About section, or null for one made before it existed. */
  about?: ApiPlanDetail["about"];
  createdAt?: string;
  startedAt?: string | null;
  /** The first day's date: each later day follows a day apart. */
  startDate?: string | null;
  thumbnailColors?: string[];
  /** The sermon's artwork; none by default. */
  thumbnailUrl?: string | null;
};

function addDays(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00.000Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

function dayOf(
  seed: number,
  plan: Required<Pick<PlanOptions, "status" | "completedDays">> & PlanOptions,
  dayNumber: number,
): PlanDay {
  const id = ids(seed);
  const current =
    plan.status === "active" || plan.status === "ready" ? plan.completedDays + 1 : null;
  const status: DayStatus =
    plan.status === "completed" || dayNumber <= plan.completedDays
      ? "completed"
      : dayNumber === current
        ? (plan.currentDayStatus ?? "available")
        : "locked";
  const completedSteps: Step[] =
    status === "completed"
      ? [...STEPS]
      : dayNumber === current
        ? [...(plan.currentDaySteps ?? [])]
        : [];
  const quickCheckId = plan.quickCheckEnabled === false ? null : id.quiz(dayNumber);
  const standing = quickCheckId
    ? status === "completed"
      ? { status: "completed" as const, answered: 3, correct: 3 }
      : dayNumber === current
        ? (plan.quickCheck ?? { status: "notStarted" as const })
        : { status: "notStarted" as const }
    : null;
  const scheduledOn = plan.startDate ? addDays(plan.startDate, dayNumber - 1) : null;
  return {
    id: id.day(dayNumber),
    dayNumber,
    estimatedMinutes: 9,
    reading: {
      title: `Day ${dayNumber} reading`,
      paragraphs: [{ heading: `Idea ${dayNumber}`, content: `The reading for day ${dayNumber}.` }],
      sermonQuote: null,
      sermonClip: null,
    },
    scriptureReference: {
      id: id.scripture(dayNumber),
      reference: `John 3:${dayNumber}`,
      book: "John",
      chapter: 3,
      verseStart: dayNumber,
      verseEnd: dayNumber,
    },
    reflectionPrompts: [
      { id: id.reflection(dayNumber, 1), order: 1, question: `Question 1 for day ${dayNumber}?` },
      { id: id.reflection(dayNumber, 2), order: 2, question: `Question 2 for day ${dayNumber}?` },
    ],
    prayer: { id: id.prayer(dayNumber), title: "Prayer", text: `Lord, day ${dayNumber}. Amen.` },
    quickCheckId,
    quickCheck:
      quickCheckId && standing
        ? {
            id: quickCheckId,
            status: standing.status,
            questionCount: 3,
            answeredCount: standing.answered ?? 0,
            correctCount: standing.correct ?? 0,
          }
        : null,
    progress: {
      status,
      completedSteps,
      scheduledOn,
      startedAt: status === "locked" ? null : (plan.startedAt ?? null),
      completedAt: status === "completed" ? NOW : null,
    },
  };
}

/** A plan with its days, as `GET /v1/plans/:id` returns it. Active, three days, one done, by default. */
export function aPlan(options: PlanOptions = {}): ApiPlanDetail {
  const seed = options.seed ?? 1;
  const status = options.status ?? "active";
  const lengthDays = options.lengthDays ?? 3;
  const completedDays =
    status === "completed" ? lengthDays : (options.completedDays ?? (status === "active" ? 1 : 0));
  const startedAt =
    options.startedAt !== undefined ? options.startedAt : status === "ready" ? null : NOW;
  const startDate =
    options.startDate !== undefined ? options.startDate : status === "ready" ? null : "2026-10-01";
  const resolved = { ...options, status, completedDays, startedAt, startDate };
  const days = Array.from({ length: lengthDays }, (_, index) => dayOf(seed, resolved, index + 1));
  const currentNumber =
    status === "active" || status === "ready" ? Math.min(completedDays + 1, lengthDays) : null;
  const current = currentNumber ? days[currentNumber - 1] : undefined;
  const id = ids(seed);

  return planDetailSchema.parse({
    id: id.plan,
    title: options.title ?? `Plan ${seed}`,
    status,
    lengthDays,
    estimatedMinutes: 9 * lengthDays,
    quickCheckEnabled: options.quickCheckEnabled ?? true,
    isSample: options.isSample ?? false,
    saved: options.saved ?? false,
    sermon: aSermon({
      id: id.sermon,
      title: options.title ?? `Plan ${seed}`,
      church: options.church === undefined ? "VOUS Church" : options.church,
      thumbnailColors: options.thumbnailColors ?? ["#1f2a44", "#3d4f7a"],
      thumbnailUrl: options.thumbnailUrl ?? null,
    }),
    progress: {
      completedDays,
      currentDayNumber: currentNumber,
      percentage: Math.round((completedDays / lengthDays) * 100),
    },
    currentDay: current
      ? {
          id: current.id,
          dayNumber: current.dayNumber,
          title: current.reading.title,
          estimatedMinutes: current.estimatedMinutes,
          scheduledOn: current.progress.scheduledOn,
          status: current.progress.status,
          quickCheck: current.quickCheck,
        }
      : null,
    startDate,
    startedAt,
    completedAt: status === "completed" ? NOW : null,
    archivedAt: status === "archived" ? NOW : null,
    createdAt: options.createdAt ?? NOW,
    updatedAt: NOW,
    about: options.about === undefined ? null : options.about,
    days,
  });
}

/** A plan as the list returns it: its summary, without its days. */
export function summaryOf(plan: ApiPlanDetail): ApiPlanSummary {
  return planSummarySchema.parse(plan);
}

/** One of a plan's days as the Daily Study gets it: its passage in the reader's translation. */
export function aStudyDay(plan: ApiPlanDetail, dayNumber: number): ApiStudyDay {
  const day = plan.days.find((candidate) => candidate.dayNumber === dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in ${plan.title}`);
  return studyDaySchema.parse({
    id: day.id,
    planId: plan.id,
    dayNumber,
    reading: day.reading,
    scripture: {
      ...day.scriptureReference,
      translation: "BSB",
      verses: [{ number: day.scriptureReference.verseStart, text: "For God so loved the world." }],
      cacheAllowed: true,
    },
    supportingScriptures: [],
    reflectionPrompts: day.reflectionPrompts,
    prayer: day.prayer,
    quickCheckId: day.quickCheckId,
    progress: day.progress,
  });
}

export type QuizSession = ReturnType<typeof quizSessionResponseSchema.parse>;

/**
 * A day's Quick Check session: three multiple-choice questions, the right
 * answer always "a". `answered` are taken in order, right unless listed in `wrong`.
 */
export function aQuizSession(
  plan: ApiPlanDetail,
  dayNumber: number,
  {
    status = "inProgress",
    answered = 0,
    wrong = [],
  }: { status?: "inProgress" | "completed"; answered?: number; wrong?: readonly number[] } = {},
): QuizSession {
  const day = plan.days.find((candidate) => candidate.dayNumber === dayNumber);
  if (!day?.quickCheckId) throw new Error(`Day ${dayNumber} of ${plan.title} has no Quick Check`);
  const quizId = day.quickCheckId;
  const question = (order: number) => ({
    id: uuid(900_000 + order),
    order,
    kind: "multipleChoice" as const,
    source: "sermon" as const,
    prompt: `Question ${order}?`,
    choices: ["a", "b", "c", "d"].map((label, index) => ({
      id: uuid(900_000 + order * 10 + index + 1),
      label: label.toUpperCase(),
      text: `Answer ${label} to ${order}`,
    })),
    scriptureReference: null,
  });
  const questions = [1, 2, 3].map(question);
  const answers = questions.slice(0, answered).map((asked, index) => {
    const rightId = asked.choices[0]?.id ?? "";
    const isWrong = wrong.includes(index + 1);
    return {
      answerId: uuid(800_000 + index),
      questionId: asked.id,
      choiceId: isWrong ? (asked.choices[1]?.id ?? "") : rightId,
      correct: !isWrong,
      correctChoiceId: rightId,
      explanation: `Why ${asked.order} is right.`,
      scriptureReference: null,
      answeredAt: NOW,
    };
  });
  const correct = answers.filter((answer) => answer.correct).length;
  return quizSessionResponseSchema.parse({
    quiz: {
      id: quizId,
      planId: plan.id,
      planDayId: day.id,
      title: `Day ${dayNumber} Quick Check`,
      questions,
    },
    attempt: {
      id: uuid(700_000 + dayNumber),
      quizId,
      status,
      currentQuestionId: status === "completed" ? null : (questions[answered]?.id ?? null),
      startedAt: NOW,
      completedAt: status === "completed" ? NOW : null,
    },
    answers,
    score:
      status === "completed"
        ? {
            correct,
            total: questions.length,
            percentage: Math.round((correct / questions.length) * 100),
          }
        : null,
  });
}
