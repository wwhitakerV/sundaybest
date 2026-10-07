import { createContext, useContext, type ReactNode } from "react";

import { PageEnter } from "@/ui/atoms/PageEnter";

/** Whether motion's reduced — set by the Daily Study around its page. */
type StudyEnterValue = { still: boolean };

const StudyEnterContext = createContext<StudyEnterValue | null>(null);

/**
 * Lets a Daily Study page's parts enter, one after another. The Study keys
 * each page, so every page — every step, every question — mounts fresh and
 * plays its entrance; nothing has to notice the page changed.
 */
export function StudyEnterProvider({ still, children }: StudyEnterValue & { children: ReactNode }) {
  return <StudyEnterContext.Provider value={{ still }}>{children}</StudyEnterContext.Provider>;
}

export type StudyEnterProps = {
  /** 0 the kicker, 1 the title, 2 the rest — each a beat behind the one before. */
  order: 0 | 1 | 2;
  children: ReactNode;
};

/**
 * One part of a Daily Study page, fading in as it moves left into place, in
 * its turn (`PageEnter`). Outside the Daily Study (no provider), it's shown as
 * it is.
 */
export function StudyEnter({ order, children }: StudyEnterProps) {
  const enter = useContext(StudyEnterContext);
  if (!enter) return children;
  return (
    <PageEnter testID={`study-enter-${order}`} order={order} still={enter.still}>
      {children}
    </PageEnter>
  );
}
