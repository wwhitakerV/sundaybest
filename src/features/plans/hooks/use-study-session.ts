import { useState } from "react";
import { useRouter } from "expo-router";

import type { Id, ReadingPaper } from "@/types/domain";
import { dayCompleteHref, quickCheckHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import { selectionFeedback, successFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  isReadingTextOffset,
  getUserSettings,
  getDayScripture,
  getPrayerForDay,
  getQuizForDay,
  getQuizStatus,
  getReflectionsForDay,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { getAnswer, getReflectionWrites, type ReflectionDrafts } from "../logic/reflection-drafts";
import {
  STUDY_STEPS,
  getNextStudyAction,
  getPreviousStudyAction,
  getStudyPages,
  isLastStudyPage,
  type StudyNavAction,
  type StudyPosition,
} from "../logic/study-steps";
import { useStudyRoute } from "./use-study-route";

/**
 * The Daily Study session's view model: the route's day, from the store —
 * its reading, its passage in the user's translation, its questions, its
 * prayer — where the user is in it, and what they've typed.
 *
 * Answers are typed into drafts and written to the store, all at once,
 * whenever the user moves — to another step, out of the study, or on Finish
 * — so they're there on coming back. Moving forward records the step just
 * done. Finish completes the day — its prayer prayed and the day complete in
 * one step, which records it, opens the next day, and completes the plan
 * after its last — then Day Complete *replaces* the study inside the
 * session. A day with a Quick Check still to take isn't done yet: Finish
 * hands on to the Quick Check instead, which completes the day when it's
 * done. Closing, or Previous on the first page, dismisses the
 * whole session.
 */
export function useStudySession() {
  const router = useRouter();
  const session = useModalSession();
  const { planId, dayNumber, plan, day } = useStudyRoute();
  const dayId = day?.id ?? "";
  const scripture = useAppSelector((state) => getDayScripture(state, dayId));
  const reflections = useAppSelector((state) => getReflectionsForDay(state, dayId));
  const prayer = useAppSelector((state) => getPrayerForDay(state, dayId));
  // A day with a Quick Check still to take isn't done until it's taken.
  const quickCheckDue = useAppSelector((state) => {
    const quiz = getQuizForDay(state, dayId);
    return quiz !== null && getQuizStatus(state, quiz.id) !== "completed";
  });
  const settings = useAppSelector(getUserSettings);
  const actions = useStoreActions();
  const [position, setPosition] = useState<StudyPosition>({ step: 0, page: 0 });
  const [drafts, setDrafts] = useState<ReflectionDrafts>({});
  const pages = getStudyPages(reflections.length);

  if (!plan || !day) return { found: false, position, pages } as const;
  const studyDay = day;

  function apply(action: StudyNavAction) {
    actions.commitReflections(getReflectionWrites(reflections, drafts));
    if (action.type === "exit") session.exit();
    else if (action.type === "finish" && quickCheckDue) {
      // The reading's done; the day waits on its Quick Check, which finishes it.
      tapFeedback();
      actions.updatePlanDay(studyDay.id, "pray");
      if (prayer) actions.markPrayerPrayed(prayer.id);
      router.replace(quickCheckHref(planId, dayNumber));
    } else if (action.type === "finish") {
      successFeedback();
      actions.finishPlanDay(studyDay.id, prayer?.id ?? null);
      router.replace(dayCompleteHref(planId, dayNumber));
    } else {
      tapFeedback();
      const done = STUDY_STEPS.at(position.step);
      if (action.to.step > position.step && done) actions.updatePlanDay(studyDay.id, done.key);
      setPosition(action.to);
    }
  }

  return {
    found: true,
    dayNumber,
    totalDays: plan.lengthDays,
    position,
    pages,
    isLastPage: isLastStudyPage(position, pages),
    content: { day, scripture, reflections, prayer },
    answerFor: (reflectionId: Id) => getAnswer(reflectionId, drafts, reflections),
    changeAnswer: (reflectionId: Id, answer: string) =>
      setDrafts((current) => ({ ...current, [reflectionId]: answer })),
    previous: () => apply(getPreviousStudyAction(position, pages)),
    next: () => apply(getNextStudyAction(position, pages)),
    close: () => apply({ type: "exit" }),
    /** How the page reads — its text size and paper — kept for every visit. */
    reading: {
      textOffset: settings.readingTextOffset,
      paper: settings.readingPaper,
      setTextOffset: (offset: number) => {
        if (isReadingTextOffset(offset) && offset !== settings.readingTextOffset) {
          selectionFeedback();
        }
        actions.setReadingTextOffset(offset);
      },
      setPaper: (paper: ReadingPaper) => {
        if (paper !== settings.readingPaper) selectionFeedback();
        actions.setReadingPaper(paper);
      },
    },
  } as const;
}
