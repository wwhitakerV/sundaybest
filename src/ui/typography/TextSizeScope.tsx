import { createContext, useContext, type ReactNode } from "react";

/** Points added to every typography component's size inside the nearest scope. */
const TextOffsetContext = createContext(0);

export type TextSizeScopeProps = {
  /** Points larger (or, negative, smaller) than designed. */
  offset: number;
  children: ReactNode;
};

/**
 * Text inside draws `offset` points larger or smaller, its line height in
 * proportion — the Daily Study's reading text size. The caller keeps the
 * offset within sensible limits.
 */
export function TextSizeScope({ offset, children }: TextSizeScopeProps) {
  return <TextOffsetContext.Provider value={offset}>{children}</TextOffsetContext.Provider>;
}

/** The nearest `TextSizeScope`'s offset, in points; 0 outside one. */
export function useTextOffset(): number {
  return useContext(TextOffsetContext);
}
