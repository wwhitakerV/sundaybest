/**
 * The only file other layers may import from: this entity's public contract.
 * Deep imports such as `@/entities/flock/ui/Thing` are blocked by lint.
 */
export { FlockBoard } from "./ui/FlockBoard";
export { useAttractGame } from "./ui/use-attract-game";
export { dailyBoard, dailyNumber, formatDaily } from "./logic/daily-board";
export { endCall, moveCall, startCall, currentStrength } from "./logic/flock-call";
export { advance, lockGate, slideGate } from "./logic/flock-step";
export { BAND, BOARD, SHEEP, type FlockGame } from "./logic/flock-rules";
