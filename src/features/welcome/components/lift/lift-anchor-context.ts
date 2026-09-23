import { createContext, type RefObject } from "react";
import type { View } from "react-native";

import type { DesignRect } from "../../logic/lift";

export type LiftAnchorContextValue = {
  /** The phone frame's root view; anchors report their place relative to it. */
  frameRef: RefObject<View | null>;
  /** Called with the anchored piece's place in the mock, in design points. */
  onAnchor: (rect: DesignRect) => void;
  /** True while the piece is lifted off this phone — its copy here hides. */
  hidden: boolean;
};

/** Provided per card by `FanCard`; read by the `LiftAnchor` inside its mock. */
export const LiftAnchorContext = createContext<LiftAnchorContextValue | null>(null);
