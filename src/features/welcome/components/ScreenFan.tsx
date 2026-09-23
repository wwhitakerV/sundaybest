import { useMemo, useState, type ComponentType } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BottomFade } from "@/ui/BottomFade";
import Animated from "react-native-reanimated";

import { useSceneClock } from "../hooks/use-scene-clock";
import { useStageFade } from "../hooks/use-stage-fade";
import { getLiftLayout, type DesignRect } from "../logic/lift";
import { getLiftState } from "../logic/scenes";
import {
  STORY_CARDS,
  getCaption,
  getCardPose,
  getPoseDurationMs,
  getSceneMode,
  getSceneMsFor,
  isStageShown,
  type SceneMode,
  type StoryCardKey,
  type StoryPhase,
} from "../logic/story";
import { FanCard } from "./FanCard";
import {
  LIFT_CARD_PADDING,
  LIFT_SIDE_PADDING,
  MIN_STAGE_HEIGHT,
  REST_SCALE,
  SUPPORT_OPACITY,
  getStageGeometry,
} from "./fan-geometry";
import { StageLift } from "./lift/StageLift";
import { AnswerBox } from "./lifts/AnswerBox";
import type { LiftPieceProps } from "./lifts/lift-piece";
import { DayPicker } from "./lifts/DayPicker";
import { PasteField } from "./lifts/PasteField";
import { PrayerLines } from "./lifts/PrayerLines";
import { QuizOptions } from "./lifts/QuizOptions";
import { SermonThumbnail } from "./lifts/SermonThumbnail";
import { VerseCard } from "./lifts/VerseCard";
import { CreatePlanMock } from "./mocks/CreatePlanMock";
import type { MockScreenProps } from "./mocks/mock-page";
import { PasteSermonMock } from "./mocks/PasteSermonMock";
import { PrayMock } from "./mocks/PrayMock";
import { QuickCheckMock } from "./mocks/QuickCheckMock";
import { ReflectMock } from "./mocks/ReflectMock";
import { ScriptureMock } from "./mocks/ScriptureMock";
import { SermonPreviewMock } from "./mocks/SermonPreviewMock";
import { StepCaption } from "./StepCaption";
import { WELCOME_STEPS, getStepLabel } from "./welcome-steps";

type CardParts = {
  Mock: ComponentType<MockScreenProps>;
  /** The mock's piece that lifts off on its turn. */
  Piece: ComponentType<LiftPieceProps>;
};

function getCardParts(key: StoryCardKey): CardParts {
  switch (key) {
    case "paste":
      return { Mock: PasteSermonMock, Piece: PasteField };
    case "plan":
      return { Mock: CreatePlanMock, Piece: DayPicker };
    case "preview":
      return { Mock: SermonPreviewMock, Piece: SermonThumbnail };
    case "read":
      return { Mock: ScriptureMock, Piece: VerseCard };
    case "reflect":
      return { Mock: ReflectMock, Piece: AnswerBox };
    case "pray":
      return { Mock: PrayMock, Piece: PrayerLines };
    case "quiz":
      return { Mock: QuickCheckMock, Piece: QuizOptions };
  }
}

const STAGE_OPTIONS = { restScale: REST_SCALE, supportOpacity: SUPPORT_OPACITY };
const NOT_LIFTED = { overlay: false, lifted: false };

/** A mock's clock: at the start before its turn, running during it, finished after. */
function getMockElapsed(mode: SceneMode, stageElapsedMs: number): number {
  if (mode === "before") return 0;
  if (mode === "after") return Infinity;
  return stageElapsedMs;
}

function sameRect(a: DesignRect | undefined, b: DesignRect): boolean {
  return a?.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

const ACCESSIBILITY_LABEL = `How SundayBest works: ${WELCOME_STEPS.map(getStepLabel).join(". ")}.`;

export type ScreenFanProps = {
  /** Where the intro story is; everything in the fan follows it. */
  phase: StoryPhase;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Welcome screen's intro stage. It fades in and rises with the first
 * screen already on it as the big phone, the rest of the hand small and
 * dimmed behind (done to the left, still to come to the right). Each card
 * takes its turn: its key piece of UI lifts off the phone onto a floating
 * card at real size, plays, and snaps back, while the how-it-works step it
 * shows bursts in at the bottom. After the last turn the stage fades down
 * and out, then it all begins again.
 *
 * The stage flexes to the space the page gives it. Phone tops are never
 * cut; the phones fade to white above the caption. Decorative — it reads to
 * VoiceOver as one image describing the three steps, and never takes touches.
 */
export function ScreenFan({ phase, testID, style }: ScreenFanProps) {
  // The stage flexes with the page, so it's laid out from its measured size —
  // until the first layout, from the screen's width and the minimum height.
  const { width: windowWidth } = useWindowDimensions();
  const [size, setSize] = useState({ width: windowWidth, height: MIN_STAGE_HEIGHT });
  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  }
  const geometry = getStageGeometry(size.width, size.height);
  const fadeStyle = useStageFade(isStageShown(phase));
  const [anchors, setAnchors] = useState<ReadonlyMap<StoryCardKey, DesignRect>>(() => new Map());
  // One stable callback per card, so memoised cards don't re-render for it.
  const anchorHandlers = useMemo(
    () =>
      new Map(
        STORY_CARDS.map(({ key }) => [
          key,
          (rect: DesignRect) =>
            setAnchors((previous) =>
              sameRect(previous.get(key), rect) ? previous : new Map(previous).set(key, rect),
            ),
        ]),
      ),
    [],
  );

  const stageKey = phase.kind === "focus" ? phase.card : null;
  const stageElapsedMs = useSceneClock(stageKey);
  const lift = stageKey ? getLiftState(stageElapsedMs, getSceneMsFor(stageKey)) : NOT_LIFTED;
  const poses = useMemo(
    () => STORY_CARDS.map((_, index) => getCardPose(index, phase, STAGE_OPTIONS)),
    [phase],
  );
  const durationMs = getPoseDurationMs(phase);

  const stageParts = stageKey ? getCardParts(stageKey) : null;
  const stageAnchor = stageKey ? anchors.get(stageKey) : undefined;
  const liftLayout =
    stageParts && stageAnchor
      ? getLiftLayout({
          anchor: stageAnchor,
          card: geometry.mainCard,
          stageWidth: size.width,
          bottom: geometry.liftBottom,
          minTop: geometry.liftMinTop,
          sidePadding: LIFT_SIDE_PADDING,
          cardPadding: LIFT_CARD_PADDING,
          fade: geometry.fade,
        })
      : null;

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={ACCESSIBILITY_LABEL}
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.fan, style, fadeStyle]}
    >
      <View style={styles.cards}>
        {STORY_CARDS.map(({ key }, index) => {
          const pose = poses.at(index);
          const onAnchor = anchorHandlers.get(key);
          if (!pose || !onAnchor) return null;
          const { Mock } = getCardParts(key);

          return (
            <FanCard
              key={key}
              pose={pose}
              durationMs={durationMs}
              Mock={Mock}
              elapsedMs={getMockElapsed(getSceneMode(index, phase), stageElapsedMs)}
              liftHidden={key === stageKey && lift.overlay && liftLayout !== null}
              onAnchor={onAnchor}
              {...(testID && { testID: `${testID}-card-${key}` })}
            />
          );
        })}

        <BottomFade
          height={geometry.fadeLayer.height}
          solidHeight={geometry.fadeLayer.solidHeight}
        />
      </View>

      {stageKey && stageParts && stageAnchor && liftLayout && lift.overlay && (
        <StageLift
          key={stageKey}
          Piece={stageParts.Piece}
          elapsedMs={stageElapsedMs}
          anchor={stageAnchor}
          layout={liftLayout}
          cardPadding={LIFT_CARD_PADDING}
          lifted={lift.lifted}
        />
      )}

      <StepCaption
        caption={getCaption(phase)}
        style={[styles.caption, geometry.caption]}
        {...(testID && { testID: `${testID}-caption` })}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fan: { minHeight: MIN_STAGE_HEIGHT },
  // Clips only what the fade has already turned white — never the top of a card.
  cards: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  caption: { position: "absolute", left: 0, right: 0 },
});
