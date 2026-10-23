/**
 * The only file other layers may import from: this entity's public contract.
 * Deep imports such as `@/entities/rise/ui/Thing` are blocked by lint.
 */
export { RiseBoard } from "./ui/RiseBoard";
export { RiseMark } from "./ui/RiseMark";
export { RiseDrifter } from "./ui/RiseDrifter";
export { useRiseDrifter } from "./ui/use-rise-drifter";
export { useRiseAutoplay } from "./ui/use-rise-autoplay";
export { useRisePoster } from "./ui/use-rise-poster";
export { POSTER, type PosterFormat } from "./ui/draw-poster";
export {
  formatSpare,
  formatRiseDay,
  riseDayNumber,
  riseQuestions,
  type RiseQuestion,
} from "./logic/rise-day";
export { RISE_PRACTICE } from "./logic/rise-demo";
export { beginStroke, endStroke, moveStroke } from "./logic/rise-paint";
export { RISE, type RiseGame } from "./logic/rise-rules";
export { newRiseGame, riseStage } from "./logic/rise-setup";
export { activePair, advanceRise, replayRise, startRise } from "./logic/rise-step";
