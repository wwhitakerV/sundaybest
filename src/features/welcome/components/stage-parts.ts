import type { ComponentType } from "react";

import { PASSAGE_CARD_RADIUS } from "@/entities/scripture";
import { SERMON_CLIP_RADIUS } from "@/entities/sermon";
import type { LiftBacking } from "../logic/lift";
import type { LiftPieceProps } from "../logic/lift-piece";
import { LIFT_RIM } from "../logic/fan-geometry";
import type { MockScreenProps } from "../logic/mock-page";
import type { StoryCardKey, StoryScreen } from "../logic/story";
import { ANSWER_BOX_RADIUS, AnswerBox } from "./lifts/AnswerBox";
import { ListenCard } from "./lifts/ListenCard";
import { PASTE_FIELD_RADIUS, PasteField } from "./lifts/PasteField";
import { PlanSetup } from "./lifts/PlanSetup";
import { PrayerLines } from "./lifts/PrayerLines";
import { QUIZ_OPTION_RADIUS, QuizOptions } from "./lifts/QuizOptions";
import { VerseCard } from "./lifts/VerseCard";
import { NewPlanMock } from "./mocks/NewPlanMock";
import { QuickCheckMock } from "./mocks/QuickCheckMock";
import { StudyMock } from "./mocks/StudyMock";

/** Each of the app's screens the phone shows, as a mock. */
export function getScreenMock(screen: StoryScreen): ComponentType<MockScreenProps> {
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
export type LiftPart = {
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
export function getLiftParts(key: StoryCardKey): readonly LiftPart[] {
  switch (key) {
    case "paste":
      // A short piece: raised a little, so it floats nearer the middle of the phone.
      return [{ ...lift(PasteField, PASTE_FIELD_RADIUS), raise: 30 }];
    case "plan":
      return [liftOntoCard(PlanSetup, 12, 24)];
    case "read":
      // Rests a little higher than the rest.
      return [{ ...lift(ListenCard, SERMON_CLIP_RADIUS), raise: 24 }];
    case "scripture":
      return [lift(VerseCard, PASSAGE_CARD_RADIUS)];
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
