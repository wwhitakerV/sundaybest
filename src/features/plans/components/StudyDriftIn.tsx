import { createContext, useContext, type ReactNode } from "react";

import { DriftIn } from "./DriftIn";

/** The page being brought in (`revealKey`), and whether motion's reduced — set by the Daily Study. */
type StudyDriftValue = { revealKey: unknown; still: boolean };

const StudyDriftContext = createContext<StudyDriftValue | null>(null);

/** Lets a Daily Study page's parts drift in, one after another, each time `revealKey` changes. */
export function StudyDriftProvider({
  revealKey,
  still,
  children,
}: StudyDriftValue & { children: ReactNode }) {
  return (
    <StudyDriftContext.Provider value={{ revealKey, still }}>{children}</StudyDriftContext.Provider>
  );
}

export type StudyDriftInProps = {
  /** 0 the kicker, 1 the title, 2 the rest — each a beat behind the one before. */
  order: 0 | 1 | 2;
  children: ReactNode;
};

/**
 * One part of a Daily Study page, fading in as it drifts down and a touch
 * right into place, in its turn. Outside the Daily Study (no provider), it's
 * shown as it is.
 */
export function StudyDriftIn({ order, children }: StudyDriftInProps) {
  const drift = useContext(StudyDriftContext);
  if (!drift) return children;
  return (
    <DriftIn
      testID={`study-drift-${order}`}
      revealKey={drift.revealKey}
      order={order}
      still={drift.still}
    >
      {children}
    </DriftIn>
  );
}
