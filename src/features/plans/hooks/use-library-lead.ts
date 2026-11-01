import { useRef, useState } from "react";
import { useWindowDimensions, type View } from "react-native";
import { runOnJS, useAnimatedReaction, type SharedValue } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { BookOpen, Lock } from "lucide-react-native";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { usePlanQuery } from "@/core/api/plan-queries";
import { useStudyDayQuery } from "@/core/api/study-queries";
import { seriesLine } from "@/entities/sermon";
import { placePlanHref } from "@/entities/tabs";
import { useFrameClearance } from "@/ui/organisms/ScrollFrame";
import { useHideTabBarFab, useTabBarAccessory } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { isLeadContinueOutOfView } from "../logic/lead-hand-over";
import { describeNextStep, nextStepOf, openDayOf } from "../logic/next-step";
import {
  currentDayOf,
  describeFolio,
  describeIssue,
  describeLeadAction,
} from "../logic/plan-library";
import { usePlanDetail } from "./use-plan-detail";

/** Where Continue was measured: down the screen, how tall, and how far the page was scrolled then. */
type Measured = { top: number; height: number; measuredAt: number };

/**
 * The plan My studies leads with, featured as an issue (`PlanIssue`): its
 * church and Scripture, its title, the step waiting in its own words (the
 * sermon's, when nothing is), its days and Continue — its artwork opening
 * it. Whenever Continue's out of view — below the fold on a short
 * phone, or scrolled up under the header — the tab bar takes it, in the
 * floating button's place. `scrolled` is the library's scroll; `headerFoot`
 * where its header ends, down the screen.
 */
export function useLibraryLead(
  plan: ApiPlanSummary,
  scrolled: SharedValue<number>,
  headerFoot: SharedValue<number>,
) {
  const router = useRouter();
  const detail = usePlanDetail(plan.id);
  const full = usePlanQuery(plan.id).data?.plan ?? null;
  const { passage, standfirst } = full ? describeIssue(full) : { passage: null, standfirst: null };
  // The step waiting, in its own words — the day's Scripture fetched only when that's the step.
  const openDay = full ? openDayOf(full) : null;
  const versesWanted = openDay !== null && nextStepOf(openDay) === "scripture";
  const studyDay = useStudyDayQuery(plan.id, versesWanted ? openDay.dayNumber : 0).data?.day;
  const nextStep = openDay && describeNextStep(openDay, studyDay?.scripture.verses ?? null);

  const clearance = useFrameClearance();
  const { height: screenHeight } = useWindowDimensions();
  const dockTop = screenHeight - clearance.bottom;
  const continueRef = useRef<View>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [handedOff, setHandedOff] = useState(false);
  useAnimatedReaction(
    () =>
      isLeadContinueOutOfView({
        top: measured?.top ?? null,
        height: measured?.height ?? 0,
        measuredAt: measured?.measuredAt ?? 0,
        scrolled: scrolled.get(),
        headerFoot: headerFoot.get(),
        dockTop,
      }),
    (now, before) => {
      if (now !== before) runOnJS(setHandedOff)(now);
    },
    [measured, dockTop],
  );

  const handOver = handedOff && detail.continueLabel !== null;
  useTabBarAccessory(
    {
      label: detail.continueLabel ?? "",
      testID: "plans-tab-bar-continue",
      icon: detail.continueWaiting ? Lock : BookOpen,
      waiting: detail.continueWaiting,
      onPress: detail.openCurrentDay,
    },
    handOver,
  );
  // Continue takes the floating button's place while it's down there.
  useHideTabBarFab(handOver);

  return {
    /** It featured (`PlanIssue`) — once its own page has arrived. */
    issue:
      detail.found && detail.continueLabel !== null
        ? {
            title: plan.title,
            series: seriesLine(plan.sermon),
            thumbnailUrl: plan.sermon.thumbnailUrl,
            folio: describeFolio(plan, passage),
            // Nothing waiting — the day done, the next not open — and its takeaway stands in.
            standfirst: nextStep ?? standfirst,
            days: {
              total: plan.lengthDays,
              done: plan.progress.completedDays,
              current: currentDayOf(plan),
            },
            action: describeLeadAction(plan, detail.continueWaiting),
            waiting: detail.continueWaiting,
          }
        : null,
    openCurrentDay: detail.openCurrentDay,
    open: () => router.push(placePlanHref("plans", plan.id)),
    /** Continue, measured where it sits on the screen as it's laid out. */
    continuePlace: {
      ref: continueRef,
      onLayout: () => {
        const at = scrolled.get();
        continueRef.current?.measureInWindow((_x, top, _width, height) =>
          setMeasured({ top, height, measuredAt: at }),
        );
      },
    },
  };
}
