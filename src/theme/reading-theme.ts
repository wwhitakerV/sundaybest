import type { ReadingPaper } from "@/types/domain";

import { READING_PAPERS, darkTheme, lightTheme, type Theme } from "./tokens";

/**
 * Each paper's theme, built once: a light paper keeps the light theme and lays
 * its own colour down as the background; a dark one takes the dark theme, so
 * every ink and surface on it stays readable. Built once, so a page's theme
 * is the same object from render to render.
 */
const READING_THEMES = new Map<ReadingPaper, Theme>(
  READING_PAPERS.map((paper) => {
    const base = paper.dark ? darkTheme : lightTheme;
    return [paper.id, { ...base, colors: { ...base.colors, background: paper.background } }];
  }),
);

/** The theme a page reads with on `paper`. */
export function getReadingTheme(paper: ReadingPaper): Theme {
  return READING_THEMES.get(paper) ?? lightTheme;
}
