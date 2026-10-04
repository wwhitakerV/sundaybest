import { createContext, useContext, type ReactNode } from "react";

import type { TextSize } from "@/types/domain";

const TextScaleContext = createContext(1);

export function textScaleFor(size: TextSize): number {
  switch (size) {
    case "small":
      return 0.92;
    case "default":
      return 1;
    case "large":
      return 1.08;
    case "extraLarge":
      return 1.16;
  }
}

export function TextScaleScope({ scale, children }: { scale: number; children: ReactNode }) {
  return <TextScaleContext.Provider value={scale}>{children}</TextScaleContext.Provider>;
}

export function useGlobalTextScale(): number {
  return useContext(TextScaleContext);
}
