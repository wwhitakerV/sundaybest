import seeArt from "../../../../assets/formation/see.png";
import hearArt from "../../../../assets/formation/hear.png";
import understandArt from "../../../../assets/formation/understand.png";
import doArt from "../../../../assets/formation/do.png";
import speakArt from "../../../../assets/formation/speak.png";
import examineArt from "../../../../assets/formation/examine.png";

/**
 * Each faculty's object as its artwork — a cut-out on transparency, lit from
 * the upper right as the board is, with no shadow of its own — by the board
 * object it stands for (`IDEAL_OBJECTS`).
 */
export const FACULTY_ART = {
  eye: seeArt,
  ear: hearArt,
  brain: understandArt,
  hand: doArt,
  speech: speakArt,
  heart: examineArt,
} as const;
