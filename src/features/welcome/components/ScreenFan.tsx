import { useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

import { BottomFade } from "@/ui/atoms/BottomFade";
import { PHONE_FRAME } from "../logic/phone-frame";
// Progress line switched off for now — see the render below.
// import { ProgressLine } from "./ProgressLine";
import { useLiftAnchors } from "../hooks/use-lift-anchors";
import { useSceneClock } from "../hooks/use-scene-clock";
import { useStageSlide } from "../hooks/use-stage-slide";
import { getLiftLayout, getLiftId } from "../logic/lift";
import { NAVIGATION_MS, getActiveLift } from "../logic/scenes";
import {
  // STORY_LOOP_MS,
  getCaption,
  getLiftsFor,
  getNavigation,
  getScreen,
  getScreenView,
  isStageShown,
  type StoryPhase,
  type StoryScreen,
} from "../logic/story";
import {
  LIFT_SIDE_PADDING,
  MIN_STAGE_HEIGHT,
  TOP_PAD,
  getStageGeometry,
} from "../logic/fan-geometry";
import { LiftAnchorContext } from "./lift/lift-anchor-context";
import { StageLift } from "./lift/StageLift";
import { ScreenPush, type PhoneNavigation } from "./ScreenPush";
import { SideHand } from "./SideHand";
import { StagePhone } from "./StagePhone";
import { StepCaption } from "./StepCaption";
import { getLiftParts, getScreenMock } from "./stage-parts";
import { useStageScroll } from "../hooks/use-stage-scroll";
import { WELCOME_STEPS, getStepLabel } from "../logic/welcome-steps";

/** Navigating within the phone: a step is the screen's own business, not navigation. */
function toPhoneNavigation(phase: StoryPhase): PhoneNavigation {
  const navigation = getNavigation(phase);
  return navigation === "push" || navigation === "modal" ? navigation : "cut";
}

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

  const { anchors, onAnchor } = useLiftAnchors();

  const turnKey = phase.kind === "focus" ? phase.card : null;
  const turnElapsedMs = useSceneClock(turnKey, CLOCK_QUIET_MS);

  const { screen, screenStep, studyScroll, getScrollOf } = useStageScroll({
    phase,
    geometry,
    turnKey,
    turnElapsedMs,
    anchors,
  });
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
        ? { scrollY: studyScroll.y, scrollStep: studyScroll.step }
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
          <SideHand fanned={shown} {...(testID && { testIDPrefix: testID })} />

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
  caption: { position: "absolute", left: 0, right: 0 },
  progress: { position: "absolute", left: 0, right: 0 },
  captionFill: { flex: 1 },
});
