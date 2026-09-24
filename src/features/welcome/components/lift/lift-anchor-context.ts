import { createContext, type RefObject } from "react";
import type { View } from "react-native";

import type { DesignRect } from "../../logic/lift";

export type LiftAnchorContextValue = {
  /** The phone frame's root view; anchors report their place relative to it. */
  frameRef: RefObject<View | null>;
  /** Called with an anchored piece's place in the mock, in design points. */
  onAnchor: (id: string, rect: DesignRect) => void;
  /** The piece that's off the phone right now (its copy here hides), if any. */
  hiddenId: string | null;
};

/** Provided around the big phone's screens; read by the `LiftAnchor`s in them. */
export const LiftAnchorContext = createContext<LiftAnchorContextValue | null>(null);

/** A lift piece's id: its turn, and which of that turn's lifts it is. */
export function getLiftId(card: string, index: number): string {
  return `${card}:${index}`;
}
