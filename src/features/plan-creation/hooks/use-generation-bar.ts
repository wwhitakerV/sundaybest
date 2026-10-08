import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import {
  useCurrentGenerationsQuery,
  useDismissGenerationMutation,
  usePlanStarts,
  useRetryGenerationMutation,
} from "@/core/api/generation-queries";
import { useCreatePlanMutation } from "@/core/api/plan-queries";
import { NEW_PLAN_HREF, planOverviewHref } from "@/entities/plan";
import type { PlanGenerationStatus } from "@/types/domain";
import { toBuild } from "../data/current-builds";
import { getGenerationBar } from "../logic/generation-bar";
import { GENERATION_SHEET_HREF } from "../logic/routes";

/** What the bar's build is building: enough to list its steps. */
type BuildSubject = {
  status: PlanGenerationStatus;
  lengthDays: number;
  quickCheck: boolean;
};

/**
 * The generation bar's view model, shared by the bar and its sheet: the
 * reader's newest build — asked for, building, ready, or failed — and what
 * the reader can do about it. A plan dismissed while it was still being
 * asked for is dismissed on the server as soon as the server has it.
 */
export function useGenerationBar() {
  const router = useRouter();
  const current = useCurrentGenerationsQuery();
  const { starts, landed, forget } = usePlanStarts();
  const { mutate: create } = useCreatePlanMutation();
  const { mutate: retryBuild } = useRetryGenerationMutation();
  const { mutate: dismissBuild } = useDismissGenerationMutation();
  const [hiddenStarts, setHiddenStarts] = useState<ReadonlySet<string>>(() => new Set());

  const builds = useMemo(() => (current.data ?? []).map(toBuild), [current.data]);
  const visibleStarts = starts.filter((start) => !hiddenStarts.has(start.key));
  const view = getGenerationBar(builds, visibleStarts);

  useEffect(() => {
    for (const start of landed) {
      if (!hiddenStarts.has(start.key)) continue;
      dismissBuild(start.generationId);
      forget(start.key);
    }
  }, [landed, hiddenStarts, dismissBuild, forget]);

  const start = visibleStarts.at(-1);
  const build = view?.id ? builds.find((candidate) => candidate.id === view.id) : undefined;
  const subject: BuildSubject | null = build
    ? { status: build.status, lengthDays: build.lengthDays, quickCheck: build.quickCheck }
    : start
      ? {
          status: "preparing",
          lengthDays: start.request.lengthDays,
          quickCheck: start.request.quickCheckEnabled,
        }
      : null;

  function dismiss() {
    if (!view) return;
    if (view.id) dismissBuild(view.id);
    else if (view.kind === "failed" && view.startKey) forget(view.startKey);
    else if (start) setHiddenStarts((hidden) => new Set(hidden).add(start.key));
  }

  function open() {
    if (view?.kind !== "ready") return;
    router.push(planOverviewHref(view.planId));
    dismissBuild(view.id);
  }

  function retry() {
    if (view?.kind !== "failed") return;
    const failedStart = view.startKey
      ? starts.find((candidate) => candidate.key === view.startKey)
      : undefined;
    if (failedStart) {
      forget(failedStart.key);
      create(failedStart.request);
    } else if (view.id) {
      retryBuild(view.id);
    }
  }

  function chooseAnother() {
    if (view?.id) dismissBuild(view.id);
    router.push(NEW_PLAN_HREF);
  }

  return {
    view,
    subject,
    dismiss,
    open,
    retry,
    chooseAnother,
    expand: () => router.push(GENERATION_SHEET_HREF),
  };
}
