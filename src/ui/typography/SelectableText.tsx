import { useEffect, useRef } from "react";
import { Text, TextInput, type StyleProp } from "react-native";

import { useTheme, type Theme } from "@/theme";
import { useTextOffset } from "./TextSizeScope";
import type { LayoutTextStyle } from "./ThemedText";
import { scaleTypeStyle, toneColor, type Tone } from "./tone";
import { useTextScale } from "./use-text-scale";

/** The faces text to be selected comes in: a statement, a tracked label, a row's detail. */
export type SelectableFace = "statement" | "label" | "detail";

/** One run of a selectable block, in its own face and tone: lines of a block are parts. */
export type SelectablePart = { text: string; face: SelectableFace; tone?: Tone };

function typeFor(typography: Theme["typography"], face: SelectableFace) {
  switch (face) {
    case "statement":
      return typography.editorialDisplay;
    case "label":
      return typography.metaLabelTracked;
    case "detail":
      return typography.rowDetail;
  }
}

export type SelectableTextProps = {
  /** Its parts, each on its own line, selected as one: a selection runs from one into the next. */
  parts: SelectablePart[];
  /** Changed, any selection in it goes — as a tap away from it should do. */
  clear?: number;
  style?: StyleProp<LayoutTextStyle>;
  testID?: string;
};

/**
 * Text to be read and taken away: selected as iOS selects — a long press or
 * double tap takes a word, handles drag it wider, across all its lines, the
 * system's menu offers Copy, Look Up, Translate and Share — in the same faces,
 * tones and sizes as the app's other text. It's iOS's own text view,
 * read-only: never a caret, never a keyboard, its inset taken away so it
 * sits where text would. A selection can't leave it for another.
 */
export function SelectableText({ parts, clear = 0, style, testID }: SelectableTextProps) {
  const theme = useTheme();
  const scale = useTextScale();
  const offset = useTextOffset();
  const view = useRef<TextInput>(null);
  const styleOf = (part: SelectablePart) => [
    scaleTypeStyle(typeFor(theme.typography, part.face), scale, offset),
    { color: toneColor(theme.colors, part.tone ?? "text") },
  ];

  // Told to let go: the selection collapses, and the text view gives up being selected in.
  useEffect(() => {
    if (clear === 0) return;
    view.current?.setSelection(0, 0);
    view.current?.blur();
  }, [clear]);

  const [first] = parts;
  return (
    <TextInput
      ref={view}
      testID={testID}
      editable={false}
      multiline
      scrollEnabled={false}
      accessibilityRole="text"
      style={[first ? styleOf(first) : null, INSET_NONE, style]}
    >
      {parts.map((part, index) => (
        <Text key={index} style={styleOf(part)}>
          {index > 0 ? `\n${part.text}` : part.text}
        </Text>
      ))}
    </TextInput>
  );
}

/** A text view's own inset, taken away: its first line sits where a line of text would. */
const INSET_NONE = { padding: 0, paddingTop: 0, paddingBottom: 0 };
