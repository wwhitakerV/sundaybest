import { useState } from "react";

import { PHONE_FRAME } from "../logic/phone-frame";
import { NEW_PLAN_HEADER_HEIGHT } from "../logic/new-plan-header";
import type { StageGeometry } from "../logic/fan-geometry";
import { getLiftId, getScrollToReveal, getScrollToShow, type DesignRect } from "../logic/lift";
import { getScrollTargetIndex } from "../logic/scenes";
import {
  getLiftsFor,
  getScreen,
  getScreenView,
  type StoryCardKey,
  type StoryPhase,
  type StoryScreen,
} from "../logic/story";

/**
 * Where New Plan's days land once it has scrolled to them, below its header
 * (design points): room for "How many days?" above them (~21pt, then its
 * 24pt gap) with space to breathe above that.
 */
const SCROLL_TOP_MARGIN = 80;
/** Clear space kept below a piece the study session has scrolled into view (design points). */
const SCROLL_BOTTOM_MARGIN = 28;
/** How far each scrolling screen is scrolled (design points). */
type Scrolls = {
  newPlan: number;
  /** Only `step`'s page is scrolled; every other step's page sits at its top. */
  study: { step: number; y: number };
};
/** Every scrolling screen at its top. */
const NO_SCROLL: Scrolls = { newPlan: 0, study: { step: 0, y: 0 } };

/**
 * How far the stage's phone screens are scrolled. Screens scroll a piece
 * into view before it lifts: New Plan brings its section near the top of
 * the part of the phone the stage shows, below its fixed header; the study
 * session scrolls just far enough to show it.
 *
 * Each screen holds its scroll once scrolled: New Plan stays put while the
 * study session slides up over it, and a study step's page keeps its scroll
 * while it fades out — the next step's page starts at its top. All are back
 * at the top when the story starts again.
 */
export function useStageScroll(input: {
  phase: StoryPhase;
  geometry: StageGeometry;
  /** The story card whose turn it is, and how far into it. */
  turnKey: StoryCardKey | null;
  turnElapsedMs: number;
  /** Where each lift piece sits in its mock, keyed by `getLiftId`. */
  anchors: ReadonlyMap<string, DesignRect>;
}) {
  const { phase, geometry, turnKey, turnElapsedMs, anchors } = input;
  const screen = getScreen(phase);
  const visibleBottom = (geometry.fade.from - geometry.mainCard.y) / geometry.mainCard.scale;
  const scrollTop = PHONE_FRAME.contentTop + NEW_PLAN_HEADER_HEIGHT;
  const scrollIndex = turnKey ? getScrollTargetIndex(turnElapsedMs, getLiftsFor(turnKey)) : null;
  const scrollAnchor =
    turnKey && scrollIndex !== null ? anchors.get(getLiftId(turnKey, scrollIndex)) : undefined;
  function getScrollTarget(anchor: DesignRect): number {
    return screen === "newPlan"
      ? getScrollToShow(anchor, {
          contentTop: scrollTop,
          maxScroll: Math.max(
            0,
            PHONE_FRAME.contentHeight - (visibleBottom - PHONE_FRAME.contentTop),
          ),
          topMargin: SCROLL_TOP_MARGIN,
        })
      : getScrollToReveal(anchor, { visibleBottom, bottomMargin: SCROLL_BOTTOM_MARGIN });
  }
  const scrollTarget = scrollAnchor ? getScrollTarget(scrollAnchor) : null;
  const screenStep = getScreenView(screen, phase, 0).step;
  const [scrolls, setScrolls] = useState<Scrolls>(NO_SCROLL);
  if (phase.kind === "arrive") {
    if (scrolls !== NO_SCROLL) setScrolls(NO_SCROLL);
  } else if (scrollTarget !== null && screen === "newPlan") {
    if (Math.abs(scrollTarget - scrolls.newPlan) > 0.5) {
      setScrolls({ ...scrolls, newPlan: scrollTarget });
    }
  } else if (scrollTarget !== null && screen === "study") {
    const { step, y } = scrolls.study;
    if (step !== screenStep || Math.abs(scrollTarget - y) > 0.5) {
      setScrolls({ ...scrolls, study: { step: screenStep, y: scrollTarget } });
    }
  }
  /** How far `of`'s page at `step` is scrolled. */
  function getScrollOf(of: StoryScreen, step: number): number {
    if (of === "newPlan") return scrolls.newPlan;
    if (of === "study" && scrolls.study.step === step) return scrolls.study.y;
    return 0;
  }

  return { screen, screenStep, studyScroll: scrolls.study, getScrollOf };
}
