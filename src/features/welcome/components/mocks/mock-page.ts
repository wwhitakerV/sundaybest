import { StyleSheet } from "react-native";

/** A mock screen: which of its steps it's on, and how far into that step's turn. */
export type MockScreenProps = {
  step: number;
  /** 0 before its turn, counting up during it, `Infinity` after. */
  elapsedMs: number;
  /** How far its content is scrolled, in design points (0 = top), on a screen that scrolls. */
  scrollY?: number;
  /**
   * On a screen whose steps each have their own page, the step `scrollY` is
   * for; every other step's page sits at its top.
   */
  scrollStep?: number;
};

/** A mock screen's body for one step: how far into that step's turn. */
export type MockBodyProps = {
  elapsedMs: number;
};

/**
 * How far into its turn the body a stepping screen is showing is. Its body
 * lags its step while cross-fading (`useStepTransition`), so the body still
 * showing is either the current step, a finished earlier one, or — stepping
 * back — one not started.
 */
export function getBodyElapsedMs(renderedStep: number, step: number, elapsedMs: number): number {
  if (renderedStep === step) return elapsedMs;
  return renderedStep < step ? Infinity : 0;
}

/**
 * The page inset every mock screen shares — the same 24pt sides, 12pt top,
 * and 16pt section gap `Screen`'s `padded` applies on a real screen, so a
 * mock sits in its phone exactly as the real screen would.
 */
export const MOCK_PAGE = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  body: { gap: 16 },
});
