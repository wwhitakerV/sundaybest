import { planCompleteHref, planOverviewHref } from "@/entities/plan";
import { useRemindersQuery, useWeekQuery } from "@/core/api/reader-queries";
import { useQuizSessionQuery } from "@/core/api/quiz-queries";
import { usesTwentyFourHourClock } from "@/core/localization/clock";
import { useReflectionAnswers } from "@/core/storage/reflection-answer-queries";
import { useToday } from "@/core/store";
import { describeWeekTile } from "@/features/progress";
import { useModalSession } from "@/hooks/use-modal-session";
import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";
import { useRouter } from "expo-router";
import { describeRemembered, describeUpNext, pickKeyVerse } from "../logic/day-complete";
import { describeQuizReview, missedFirst, toQuestionViews } from "../logic/quick-check-review";
import { useStudyRoute } from "./use-study-route";

/**
 * A day's finish page: the day done, this week's strip with it filled, what
 * was gained (its key verse and the first thing written, from this phone),
 * its Quick Check — what was remembered, every answer, missed first — and
 * what's next. Done goes on to Plan complete, or back to the plan.
 */
export function useDayComplete() {
  const router = useRouter();
  const session = useModalSession();
  const today = useToday();
  const route = useStudyRoute();
  const { planId, dayNumber, plan, day } = route;

  const weekQuery = useWeekQuery(getWeekStartSunday(today));
  const remindersQuery = useRemindersQuery();
  const quizId = day?.quickCheckId ?? "";
  const quizQuery = useQuizSessionQuery(quizId, quizId.length > 0);
  const answers = useReflectionAnswers(day?.reflectionPrompts.map((prompt) => prompt.id) ?? []);

  const week = weekQuery.data ?? null;
  const loading = route.loading || weekQuery.isPending || remindersQuery.isPending;

  if (!plan || !day || !week) {
    return {
      found: false,
      loading,
      dayNumber,
      error: route.error ?? weekQuery.error,
      retry: async () => {
        await Promise.all([route.refetch(), weekQuery.refetch(), remindersQuery.refetch()]);
      },
    } as const;
  }

  const reminder =
    remindersQuery.data?.reminders.find((candidate) => candidate.kind === "dailyStudy") ?? null;
  const next = plan.days.find((candidate) => candidate.dayNumber === dayNumber + 1) ?? null;
  const quiz = quizQuery.data ?? null;
  const wrote =
    day.reflectionPrompts
      .map((prompt) => answers.answerFor(prompt.id).trim())
      .find((answer) => answer.length > 0) ?? null;

  return {
    found: true,
    loading: false,
    dayNumber,
    planTitle: plan.title,
    today: week.today,
    tiles: week.days.map((candidate) => ({
      date: candidate.date,
      look: describeWeekTile(candidate),
    })),
    passage: {
      reference: day.scripture.reference,
      translation: day.scripture.translation,
      verse: pickKeyVerse(day.scripture.verses),
    },
    /** The first thing written in the day's reflection — only ever from this phone. */
    wrote: wrote ? (wrote.split("\n")[0] ?? null) : null,
    quickCheck: quiz?.score
      ? {
          remembered: describeRemembered(quiz.score.correct, quiz.score.total),
          review: missedFirst(describeQuizReview(toQuestionViews(quiz), quiz.answers)),
        }
      : null,
    upNext: next
      ? {
          title: next.reading.title,
          when: describeUpNext(
            next.progress.scheduledOn,
            week.today,
            reminder,
            usesTwentyFourHourClock(),
          ),
        }
      : null,
    done: () => {
      if (plan.status === "completed") {
        router.replace(planCompleteHref(planId));
        return;
      }
      session.exitTo(planOverviewHref(planId));
    },
  } as const;
}
