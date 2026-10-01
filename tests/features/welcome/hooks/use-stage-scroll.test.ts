import { renderHook } from "@testing-library/react-native";

import { useStageScroll } from "@/features/welcome/hooks/use-stage-scroll";
import { getStageGeometry } from "@/features/welcome/logic/fan-geometry";
import type { DesignRect } from "@/features/welcome/logic/lift";
import { NEW_PLAN_HEADER_HEIGHT } from "@/features/welcome/logic/new-plan-header";
import { PHONE_FRAME } from "@/features/welcome/logic/phone-frame";
import type { StoryPhase } from "@/features/welcome/logic/story";

// A tall stage, so New Plan has room to scroll and the target is not clamped.
const geometry = getStageGeometry(393, 500);
const visibleBottom = (geometry.fade.from - geometry.mainCard.y) / geometry.mainCard.scale;

const arrive: StoryPhase = { kind: "arrive" };
const plan: StoryPhase = { kind: "focus", card: "plan" };
const read: StoryPhase = { kind: "focus", card: "read" };
const scripture: StoryPhase = { kind: "focus", card: "scripture" };

// Past the lead-in's start (plan: 1100ms, read: 900ms), so a scroll is due.
const DUE_MS = 1500;

const low: DesignRect = { x: 20, y: 600, width: 300, height: 40 };
// Low on New Plan's page, but within how far it can scroll, so the target is unclamped.
const planLow: DesignRect = { ...low, y: 400 };

type Input = Parameters<typeof useStageScroll>[0];

function setup(initial: Partial<Input> = {}) {
  const base: Input = {
    phase: arrive,
    geometry,
    turnKey: null,
    turnElapsedMs: 0,
    anchors: new Map(),
    ...initial,
  };
  return renderHook((props: Input) => useStageScroll(props), { initialProps: base });
}

describe("useStageScroll", () => {
  it("scrolls no screen before anything is anchored", () => {
    const { result } = setup({ phase: plan, turnKey: "plan", turnElapsedMs: DUE_MS });

    expect(result.current.getScrollOf("newPlan", 1)).toBe(0);
    expect(result.current.getScrollOf("study", 0)).toBe(0);
    expect(result.current.getScrollOf("quiz", 0)).toBe(0);
  });

  it("scrolls New Plan to its anchored piece once due, and holds it on a later render", () => {
    const anchors = new Map([["plan:0", planLow]]);
    const { result, rerender } = setup({
      phase: plan,
      turnKey: "plan",
      turnElapsedMs: DUE_MS,
      anchors,
    });
    const expected = planLow.y - (PHONE_FRAME.contentTop + NEW_PLAN_HEADER_HEIGHT) - 80;

    expect(expected).toBeGreaterThan(0);
    expect(result.current.getScrollOf("newPlan", 1)).toBeCloseTo(expected);

    rerender({ phase: plan, geometry, turnKey: "plan", turnElapsedMs: DUE_MS + 500, anchors });

    expect(result.current.getScrollOf("newPlan", 1)).toBeCloseTo(expected);
  });

  it("holds New Plan's scroll while the study session takes over", () => {
    const anchors = new Map([["plan:0", planLow]]);
    const { result, rerender } = setup({
      phase: plan,
      turnKey: "plan",
      turnElapsedMs: DUE_MS,
      anchors,
    });
    const held = result.current.getScrollOf("newPlan", 1);

    rerender({ phase: read, geometry, turnKey: "read", turnElapsedMs: 0, anchors });

    expect(held).toBeGreaterThan(0);
    expect(result.current.getScrollOf("newPlan", 1)).toBe(held);
  });

  it("keeps the study scroll only for the step it was taken on", () => {
    const anchors = new Map([["read:0", low]]);
    const { result, rerender } = setup({
      phase: read,
      turnKey: "read",
      turnElapsedMs: DUE_MS,
      anchors,
    });
    const expected = low.y + low.height + 28 - visibleBottom;

    expect(expected).toBeGreaterThan(0);
    expect(result.current.getScrollOf("study", 0)).toBeCloseTo(expected);
    expect(result.current.getScrollOf("study", 1)).toBe(0);
    expect(result.current.studyScroll.step).toBe(0);

    // The next step's turn has no lead-in: the first page keeps its scroll
    // (fading out) and the new page starts at its top.
    rerender({ phase: scripture, geometry, turnKey: "scripture", turnElapsedMs: 0, anchors });

    expect(result.current.getScrollOf("study", 0)).toBeCloseTo(expected);
    expect(result.current.getScrollOf("study", 1)).toBe(0);
  });

  it("puts every screen back at the top when the story arrives again", () => {
    const anchors = new Map([
      ["plan:0", planLow],
      ["read:0", low],
    ]);
    const { result, rerender } = setup({
      phase: plan,
      turnKey: "plan",
      turnElapsedMs: DUE_MS,
      anchors,
    });
    rerender({ phase: read, geometry, turnKey: "read", turnElapsedMs: DUE_MS, anchors });
    expect(result.current.getScrollOf("newPlan", 1)).toBeGreaterThan(0);
    expect(result.current.getScrollOf("study", 0)).toBeGreaterThan(0);

    rerender({ phase: arrive, geometry, turnKey: null, turnElapsedMs: 0, anchors });

    expect(result.current.getScrollOf("newPlan", 1)).toBe(0);
    expect(result.current.getScrollOf("study", 0)).toBe(0);
  });
});
