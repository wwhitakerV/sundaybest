import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import type { Id } from "@/types/domain";
import { Screen } from "@/ui/Screen";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { StudyHeader } from "../components/StudyHeader";
import { StudyNav } from "../components/StudyNav";
import { StudyStepBody } from "../components/StudyStepBody";
import { useStudyRoute } from "../hooks/use-study-route";
import { useModalSession } from "@/hooks/use-modal-session";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import {
  getDayScripture,
  getPrayerForDay,
  getReflectionsForDay,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import { useStepTransition } from "@/hooks/use-step-transition";
import { getReflectionWrites, type ReflectionDrafts } from "../logic/reflection-drafts";
import { dayCompleteHref } from "../logic/routes";
import {
  STUDY_STEPS,
  fromPageIndex,
  getNextStudyAction,
  getPreviousStudyAction,
  getStudyPages,
  isLastStudyPage,
  toPageIndex,
  type StudyNavAction,
  type StudyPosition,
} from "../logic/study-steps";

const BOTTOM_NAV_CLEARANCE =
  FLOATING_NAV_BAR.capsuleHeight + FLOATING_NAV_BAR.bottomMargin + FLOATING_NAV_BAR.sideMargin;

/**
 * Read, Scripture, Reflect, and Pray as one screen with internal step state.
 * A route per step would unmount the header, tracker, and nav on every
 * change (that was the old horizontal push); here they stay put and only
 * the body cross-fades (`useStepTransition`), calmly — each page's title,
 * then its content a beat later — since this is for reading.
 *
 * Everything shown is the route's day, from the store: its reading, its
 * passage in the user's translation, its questions — one a page, on Reflect —
 * its prayer. Answers are
 * typed into drafts and written to the store whenever the user moves — to
 * another step, out of the study, or on Finish — so they're there on coming
 * back. Moving forward records the step just done. Only Finish completes the
 * day: the prayer's marked prayed and the store completes the day — which
 * records it, opens the next day, and completes the plan after its last —
 * then Day Complete *replaces* this screen inside the session.
 *
 * The first screen of the Daily Study session modal (`src/app/study`).
 * Closing — the header's X, or Previous on the first step — dismisses the
 * whole session.
 */
export function StudyScreen() {
  const router = useRouter();
  const session = useModalSession();
  const { planId, dayNumber, plan, day } = useStudyRoute();
  const dayId = day?.id ?? "";
  const scripture = useAppSelector((state) => getDayScripture(state, dayId));
  const reflections = useAppSelector((state) => getReflectionsForDay(state, dayId));
  const prayer = useAppSelector((state) => getPrayerForDay(state, dayId));
  const actions = useStoreActions();
  const reduceMotion = useReduceMotion();

  const [position, setPosition] = useState<StudyPosition>({ step: 0, page: 0 });
  const [drafts, setDrafts] = useState<ReflectionDrafts>({});
  const pages = getStudyPages(reflections.length);
  // Pages cross-fade like steps: the transition follows one running page
  // number. Calm, for reading — each page's title, then the rest a beat later.
  const {
    renderedStep: renderedPage,
    bodyStyle,
    followStyle,
  } = useStepTransition(toPageIndex(position, pages), { profile: "calm", reduceMotion });

  if (!plan || !day) return null;
  const studyDay = day;

  const answerFor = (reflectionId: Id) =>
    new Map(Object.entries(drafts)).get(reflectionId) ??
    reflections.find((reflection) => reflection.id === reflectionId)?.answer ??
    "";
  const changeAnswer = (reflectionId: Id, answer: string) =>
    setDrafts((current) => ({ ...current, [reflectionId]: answer }));

  /** Writes what's been typed to the store — every time the user moves. */
  function commitAnswers() {
    for (const write of getReflectionWrites(reflections, drafts)) {
      if (write.kind === "clear") actions.clearReflection(write.reflectionId);
      else if (write.kind === "save") actions.saveReflection(write.reflectionId, write.answer);
      else actions.updateReflection(write.reflectionId, write.answer);
    }
  }

  function applyNavAction(action: StudyNavAction) {
    commitAnswers();
    if (action.type === "exit") session.exit();
    else if (action.type === "finish") {
      if (prayer) actions.markPrayed(prayer.id);
      actions.completePlanDay(studyDay.id);
      router.replace(dayCompleteHref(planId, dayNumber));
    } else {
      const done = STUDY_STEPS.at(position.step);
      if (action.to.step > position.step && done) actions.updatePlanDay(studyDay.id, done.key);
      setPosition(action.to);
    }
  }

  const rendered = fromPageIndex(renderedPage, pages);
  const bodyStep = STUDY_STEPS.at(rendered.step) ?? STUDY_STEPS[0];

  return (
    <Screen testID="study-screen" padded style={styles.clearBottomNav}>
      <StudyHeader
        testID="study"
        day={dayNumber}
        totalDays={plan.lengthDays}
        step={position.step}
        pages={pages}
        page={position.page}
        onClose={() => applyNavAction({ type: "exit" })}
        // Mocked action only — text-size controls aren't built yet.
        onTextSize={() => undefined}
      />

      <Animated.View style={[styles.body, bodyStyle]}>
        {/* A day's reading runs longer than the screen; the keyboard lifts the answer boxes. */}
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <StudyStepBody
            stepKey={bodyStep.key}
            page={rendered.page}
            content={{ day, scripture, reflections, prayer }}
            answerFor={answerFor}
            onAnswerChange={changeAnswer}
            followStyle={followStyle}
          />
        </ScrollView>
      </Animated.View>

      <StudyNav
        testID="study-nav"
        step={position.step}
        {...(isLastStudyPage(position, pages) && { finishLabel: "Finish" })}
        onPrevious={() => applyNavAction(getPreviousStudyAction(position, pages))}
        onNext={() => applyNavAction(getNextStudyAction(position, pages))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  clearBottomNav: { paddingBottom: BOTTOM_NAV_CLEARANCE },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 24 },
});
