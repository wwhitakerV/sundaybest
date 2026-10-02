import { SermonClipCard } from "@/entities/sermon";
import { usePressPulse } from "../../hooks/use-tap-feedback";
import { getListenScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";

/**
 * "Hear this part of the sermon", the real card. As its scene plays, play is
 * pressed — it turns to pause, and the sermon's clock starts ticking.
 */
export function ListenCard({ elapsedMs }: LiftPieceProps) {
  const { playing, clock } = getListenScene(elapsedMs);
  const pressStyle = usePressPulse(playing);

  return <SermonClipCard playing={playing} clock={clock} discStyle={pressStyle} />;
}
