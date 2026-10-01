import type { TextStyle } from "react-native";

import type { Theme } from "@/theme";

/** The colours text may take: semantic keys of the theme's colours, never raw values. */
export type Tone = Extract<
  keyof Theme["colors"],
  | "text"
  | "textMuted"
  | "textInactive"
  | "accent"
  | "onAccent"
  | "onControlPrimary"
  | "onMediaScrim"
  | "chromeTitle"
  | "chromeStepCounter"
  | "chromeIcon"
  | "stepLabelActive"
  | "stepLabelInactive"
  | "selected"
  | "border"
  | "correct"
  | "incorrect"
  | "inkOnLight"
  | "inkOnLightMuted"
  | "inkOnDark"
  | "inkOnDarkMuted"
>;

/**
 * A tone's colour — for text, and for an icon that must match it. Read
 * through a Map rather than `colors[tone]`, which the object-injection lint
 * rule flags even for a typed key.
 */
export function toneColor(colors: Theme["colors"], tone: Tone): string {
  const color = new Map<string, string>(Object.entries(colors)).get(tone);
  if (color === undefined) throw new Error(`No colour for tone "${tone}"`);
  return color;
}

/** A type style at the reader's text size: as designed at 1; sizes and leading scaled otherwise. */
export function scaleTypeStyle(type: TextStyle, scale: number): TextStyle {
  if (scale === 1) return type;
  return {
    ...type,
    ...(type.fontSize !== undefined && { fontSize: type.fontSize * scale }),
    ...(type.lineHeight !== undefined && { lineHeight: type.lineHeight * scale }),
  };
}
