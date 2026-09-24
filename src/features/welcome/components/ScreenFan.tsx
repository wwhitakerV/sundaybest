import { useMemo, useRef, useState, type ComponentType } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { BottomFade } from "@/ui/BottomFade";
import { PHONE_FRAME } from "@/ui/PhoneFrame";
// Progress line switched off for now — see the render below.
// import { ProgressLine } from "@/ui/ProgressLine";
import { useSceneClock } from "../hooks/use-scene-clock";
import { useStageSlide } from "../hooks/use-stage-slide";
import {
  getLiftLayout,
  getScrollToReveal,
  getScrollToShow,
  type DesignRect,
  type LiftBacking,
} from "../logic/lift";
import { NAVIGATION_MS, getActiveLift, getScrollTargetIndex } from "../logic/scenes";
import {
  SIDE_CARDS,
  // STORY_LOOP_MS,
  getCaption,
  getLiftsFor,
  getNavigation,
  getScreen,
  getScreenView,
  isStageShown,
  type StoryCardKey,
  type StoryPhase,
  type StoryScreen,
} from "../logic/story";
import {
  LIFT_RIM,
  LIFT_SIDE_PADDING,
  MIN_STAGE_HEIGHT,
  SUPPORT_OPACITY,
  HAND_DROP,
  TOP_PAD,
  getStageGeometry,
} from "./fan-geometry";
import { LiftAnchorContext, getLiftId } from "./lift/lift-anchor-context";
import { StageLift } from "./lift/StageLift";
import { ANSWER_BOX_RADIUS, AnswerBox } from "./lifts/AnswerBox";
import type { LiftPieceProps } from "./lifts/lift-piece";
import { LISTEN_CARD_RADIUS, ListenCard } from "./lifts/ListenCard";
import { PASTE_FIELD_RADIUS, PasteField } from "./lifts/PasteField";
import { PlanSetup } from "./lifts/PlanSetup";
import { PrayerLines } from "./lifts/PrayerLines";
import { QUIZ_OPTION_RADIUS, QuizOptions } from "./lifts/QuizOptions";
import { VERSE_CARD_RADIUS, VerseCard } from "./lifts/VerseCard";
import type { MockScreenProps } from "./mocks/mock-page";
import { NEW_PLAN_HEADER_HEIGHT, NewPlanMock } from "./mocks/NewPlanMock";
import { QuickCheckMock } from "./mocks/QuickCheckMock";
import { StudyMock } from "./mocks/StudyMock";
import { ScreenPush, type PhoneNavigation } from "./ScreenPush";
import { SideCard } from "./SideCard";
import { StagePhone } from "./StagePhone";
import { StepCaption } from "./StepCaption";
import { WELCOME_STEPS, getStepLabel } from "./welcome-steps";

/** Each of the app's screens the phone shows, as a mock. */
function getScreenMock(screen: StoryScreen): ComponentType<MockScreenProps> {
  switch (screen) {
    case "newPlan":
      return NewPlanMock;
    case "study":
      return StudyMock;
    case "quiz":
      return QuickCheckMock;
  }
}

/** A piece that lifts off the phone, and the floating card it rides on. */
type LiftPart = {
  Piece: ComponentType<LiftPieceProps>;
  /** The floating card behind it: a see-through rim around a solid container. */
  backing: LiftBacking;
  /** How much higher than usual it rests once lifted (points). */
  raise?: number;
};

/** A piece that's a card itself: the container sits right behind it, corners matched. */
const lift = (Piece: ComponentType<LiftPieceProps>, radius: number): LiftPart => ({
  Piece,
  backing: { rim: LIFT_RIM, inset: 0, radius },
});

/**
 * A piece with no surface of its own — straight on the page on the phone —
 * sits in the container with room around it.
 */
const liftOntoCard = (
  Piece: ComponentType<LiftPieceProps>,
  inset: number,
  radius: number,
): LiftPart => ({ Piece, backing: { rim: LIFT_RIM, inset, radius } });

/** The pieces that lift off on each turn, in order (matching `STORY_CARDS[].lifts`). */
function getLiftParts(key: StoryCardKey): readonly LiftPart[] {
  switch (key) {
    case "paste":
      // A short piece: raised a little, so it floats nearer the middle of the phone.
      return [{ ...lift(PasteField, PASTE_FIELD_RADIUS), raise: 30 }];
    case "plan":
      return [liftOntoCard(PlanSetup, 12, 24)];
    case "read":
      // Rests a little higher than the rest.
      return [{ ...lift(ListenCard, LISTEN_CARD_RADIUS), raise: 24 }];
    case "scripture":
      return [lift(VerseCard, VERSE_CARD_RADIUS)];
    case "reflect":
      return [lift(AnswerBox, ANSWER_BOX_RADIUS)];
    case "pray":
      // Serif lines run close to the edges, so this one gets extra room.
      return [liftOntoCard(PrayerLines, 20, 32)];
    case "quiz":
      // The options' gaps show the container, so a dimmed option never goes see-through.
      return [lift(QuizOptions, QUIZ_OPTION_RADIUS)];
  }
}

/** Navigating within the phone: a step is the screen's own business, not navigation. */
function toPhoneNavigation(phase: StoryPhase): PhoneNavigation {
  const navigation = getNavigation(phase);
  return navigation === "push" || navigation === "modal" ? navigation : "cut";
}

function sameRect(a: DesignRect | undefined, b: DesignRect): boolean {
  return a?.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

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
 * The side phones in drawing order: outermost first, so on each side the
 * phone nearer the middle lies on top, the same both ways. `index` is still
 * each one's place left to right, for when it fans.
 */
const SIDE_CARD_STACK = SIDE_CARDS.map((card, index) => ({ ...card, index })).sort(
  (a, b) => Math.abs(b.angleDeg) - Math.abs(a.angleDeg),
);

/** How far the phone may ever rise above its place: its top stays inside the stage. */
const MAX_RISE = TOP_PAD - 4;

const ACCESSIBILITY_LABEL = `How SundayBest works: ${WELCOME_STEPS.map(getStepLabel).join(". ")}.`;
/** Stay quiet while the phone navigates: nothing needs the clock until a lift is due. */
const CLOCK_QUIET_MS = Math.min(NAVIGATION_MS.push, NAVIGATION_MS.modal);

export type ScreenFanProps = {
  /** Where the intro story is; everything on the stage follows it. */
  phase: StoryPhase;
  /** Whether the story is playing (not held still for Reduce Motion): shows its progress line. */
  playing?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Welcome screen's intro stage: one big phone in the middle, still, with
 * small dimmed phones fanned equally on either side. The big phone comes up
 * alone, then the small ones fan out from behind it, left to right; at the
 * end they fold back in, right to left, before the stage drops away. The big
 * phone navigates itself through the app exactly as the real app does —
 * New Plan steps from pasting a link to picking days, scrolling them into
 * view before they play; "Create my plan" presents the Daily Study
 * session as a modal sliding up, which steps through
 * Read, Scripture, Reflect, and Pray; then Quick Check pushes on. On each turn, pieces of
 * the screen lift off onto floating cards at real size, play, and snap back,
 * while the how-it-works step shows at the bottom. Then it all begins again.
 *
 * Nothing on the stage ever scales, so nothing is ever resampled: the phone
 * is sharp on every frame. Phone tops are never cut; the phones fade to white
 * above the caption. Decorative — it reads to VoiceOver as one image
 * describing the three steps, and never takes touches.
 */
// `playing` only shows the progress line, which is switched off for now.
export function ScreenFan({ phase, testID, style }: ScreenFanProps) {
  // The stage flexes with the page, so it's laid out from its measured size —
  // until the first layout, from the screen's size. The screen is always at
  // least as tall as the stage, so the phone's entrance — which starts a
  // stage-height below its place — starts out of view even before the stage
  // has been measured, rather than flashing partway up and then jumping down.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [size, setSize] = useState({ width: windowWidth, height: windowHeight });
  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  }
  const geometry = getStageGeometry(size.width, size.height);
  const shown = isStageShown(phase);
  // Counts loops, so what carries a loop's state — the caption (and the
  // progress line, when it's on) — starts afresh each time the stage arrives,
  // never showing the last loop's step on the way.
  const [loop, setLoop] = useState({ count: 0, kind: phase.kind });
  if (phase.kind !== loop.kind) {
    setLoop({ count: loop.count + (phase.kind === "arrive" ? 1 : 0), kind: phase.kind });
  }
  // A full slide: from just below the stage's bottom edge, where it's clipped;
  // never above its place by more than the room over the phone, less its shadow.
  const { slideStyle, captionStyle } = useStageSlide(shown, size.height, MAX_RISE);
  const frameRef = useRef<View>(null);

  // Where each lift piece sits in its mock, keyed by `getLiftId`.
  const [anchors, setAnchors] = useState<ReadonlyMap<string, DesignRect>>(() => new Map());
  const onAnchor = useMemo(
    () => (id: string, rect: DesignRect) =>
      setAnchors((previous) =>
        sameRect(previous.get(id), rect) ? previous : new Map(previous).set(id, rect),
      ),
    [],
  );

  const turnKey = phase.kind === "focus" ? phase.card : null;
  const turnElapsedMs = useSceneClock(turnKey, CLOCK_QUIET_MS);

  // Screens scroll a piece into view before it lifts. New Plan brings its
  // section near the top of the part of the phone the stage shows, below its
  // fixed header; the study session scrolls just far enough to show it.
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
  // Each screen holds its scroll once scrolled: New Plan stays put while the
  // study session slides up over it, and a study step's page keeps its
  // scroll while it fades out — the next step's page starts at its top. All
  // are back at the top when the story starts again.
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
  // Which of the turn's lifts is under way, on its own clock.
  const activeLift = turnKey ? getActiveLift(turnElapsedMs, getLiftsFor(turnKey)) : null;
  const liftId = turnKey && activeLift ? getLiftId(turnKey, activeLift.index) : null;
  const liftPart = turnKey && activeLift ? getLiftParts(turnKey).at(activeLift.index) : undefined;
  const measuredAnchor = liftId ? anchors.get(liftId) : undefined;
  // Where the piece is now: measured in the page's layout, less its scroll.
  const liftAnchor = measuredAnchor && {
    ...measuredAnchor,
    y: measuredAnchor.y - getScrollOf(screen, screenStep),
  };
  const liftLayout =
    liftPart && liftAnchor
      ? getLiftLayout({
          anchor: liftAnchor,
          card: geometry.mainCard,
          stageWidth: size.width,
          bottom: geometry.liftBottom - (liftPart.raise ?? 0),
          minTop: geometry.liftMinTop,
          sidePadding: LIFT_SIDE_PADDING,
          cardPadding: liftPart.backing.rim + liftPart.backing.inset,
          fade: geometry.fade,
        })
      : null;

  // Keyed on the hidden piece's id, not the layout object (new every tick),
  // so the anchors' context only changes when a lift starts or ends.
  const hiddenId = liftLayout ? liftId : null;
  const anchorContext = useMemo(() => ({ frameRef, onAnchor, hiddenId }), [onAnchor, hiddenId]);

  function renderScreen(screen: StoryScreen) {
    const Mock = getScreenMock(screen);
    const view = getScreenView(screen, phase, turnElapsedMs);
    // The study session gets its scroll with the step it's for, so the page
    // it's showing — which lags its step while cross-fading — keeps it.
    const scroll =
      screen === "study"
        ? { scrollY: scrolls.study.y, scrollStep: scrolls.study.step }
        : { scrollY: getScrollOf(screen, view.step) };
    return <Mock step={view.step} elapsedMs={view.elapsedMs} {...scroll} />;
  }

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={ACCESSIBILITY_LABEL}
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.fan, style]}
    >
      <View style={styles.cards}>
        {/* The phone and the hand behind it slide as one; the fade stays put,
            so the phone rises out of the white and sinks back into it. */}
        <Animated.View style={[styles.slide, slideStyle]}>
          {/* Dimmed as one layer: each phone is solid within it, so where
              they overlap one never shows through another. */}
          <View style={styles.hand}>
            {SIDE_CARD_STACK.map(({ screen, step, angleDeg, index }) => (
              <SideCard
                key={`${screen}:${step}`}
                Mock={getScreenMock(screen)}
                step={step}
                index={index}
                angleDeg={angleDeg}
                fanned={shown}
                {...(testID && { testID: `${testID}-side-${screen}-${step}` })}
              />
            ))}
          </View>

          <StagePhone frameRef={frameRef} {...(testID && { testID: `${testID}-phone` })}>
            <LiftAnchorContext.Provider value={anchorContext}>
              <ScreenPush
                screenKey={getScreen(phase)}
                navigation={toPhoneNavigation(phase)}
                width={PHONE_FRAME.contentWidth}
                height={PHONE_FRAME.contentHeight}
                renderScreen={renderScreen}
              />
            </LiftAnchorContext.Provider>
          </StagePhone>
        </Animated.View>

        <BottomFade
          height={geometry.fadeLayer.height}
          solidHeight={geometry.fadeLayer.solidHeight}
        />
      </View>

      {liftId && activeLift && liftPart && liftAnchor && liftLayout && (
        <StageLift
          key={liftId}
          Piece={liftPart.Piece}
          elapsedMs={activeLift.elapsedMs}
          anchor={liftAnchor}
          layout={liftLayout}
          backing={liftPart.backing}
          lifted={activeLift.state.lifted}
        />
      )}

      {/* The story's progress line — switched off for now.
      {playing && (
        <ProgressLine
          key={loop.count}
          durationMs={STORY_LOOP_MS}
          style={[styles.progress, geometry.progress]}
          {...(testID && { testID: `${testID}-progress` })}
        />
      )}
      */}

      <Animated.View style={[styles.caption, geometry.caption, captionStyle]}>
        <StepCaption
          key={loop.count}
          caption={getCaption(phase)}
          style={styles.captionFill}
          {...(testID && { testID: `${testID}-caption` })}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fan: { minHeight: MIN_STAGE_HEIGHT },
  // Clips only what the fade has already turned white — never the top of a phone.
  cards: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  slide: StyleSheet.absoluteFill,
  hand: { ...StyleSheet.absoluteFill, top: HAND_DROP, opacity: SUPPORT_OPACITY },
  caption: { position: "absolute", left: 0, right: 0 },
  progress: { position: "absolute", left: 0, right: 0 },
  captionFill: { flex: 1 },
});
