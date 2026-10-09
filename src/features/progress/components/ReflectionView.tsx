import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { radius, space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";
import { TextField } from "@/ui/typography/TextField";
import { panelEnter } from "./panel-enter";

/** The Study's answer box's least height: room for a few lines. */
const FIELD_LEAST = 124;

export type ReflectionViewProps = {
  /** "Six weeks ago". */
  ago: string;
  /** "Thursday, August 27". */
  date: string;
  question: string;
  answer: string;
  reference: string;
  /** Lines added since, each with its date. */
  lines: readonly { writtenOn: string; date: string; text: string }[];
  /** Today's line, being written: its words, and where they go. */
  writing: { text: string; onChange: (text: string) => void; onEnd: () => void } | null;
  onOpenStudy: () => void;
};

/**
 * One reflection: how long ago and the day, in the tracked caps; what was
 * asked, as the study asked it; what was written, whole, in the Scripture
 * face's italic; the lines added since, each dated, the original never
 * changed; today's line, while it's written; and the passage it came from,
 * which opens the study. It arrives fading in as it rises (`panelEnter`).
 */
export function ReflectionView({
  ago,
  date,
  question,
  answer,
  reference,
  lines,
  writing,
  onOpenStudy,
}: ReflectionViewProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  return (
    <Animated.View
      testID="your-words-reflection"
      entering={panelEnter(reduceMotion)}
      style={{ gap: space[20] }}
    >
      <MonoLabel variant="labelTracked" tone="textMuted" style={styles.caps}>
        <Span tone="accent">{ago}</Span>
        {`   ${date}`}
      </MonoLabel>
      <View style={{ gap: space[4] }}>
        <MonoLabel variant="labelTrackedStrong" style={styles.caps}>
          You were asked
        </MonoLabel>
        <SFProBody variant="reading">{question}</SFProBody>
      </View>
      <SerifBody variant="standfirst">
        <Span italic>{answer}</Span>
      </SerifBody>
      {lines.map((line) => (
        <View key={line.writtenOn} style={{ gap: space[4] }}>
          <MonoLabel variant="labelTracked" tone="textMuted" style={styles.caps}>
            {line.date}
          </MonoLabel>
          <SerifBody variant="line">{line.text}</SerifBody>
        </View>
      ))}
      {writing && (
        <View style={{ gap: space[4] }}>
          <MonoLabel variant="labelTracked" tone="accent" style={styles.caps}>
            Today
          </MonoLabel>
          <TextField
            testID="your-words-line"
            accessibilityLabel="A line today"
            value={writing.text}
            onChangeText={writing.onChange}
            onBlur={writing.onEnd}
            placeholder="Write what comes to mind"
            multiline
            autoFocus
            // The Study's own answer box.
            style={[
              styles.field,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          />
        </View>
      )}
      <Pressable
        testID="your-words-passage"
        accessibilityRole="link"
        accessibilityLabel={`From ${reference}, open its study`}
        hitSlop={space[8]}
        onPress={onOpenStudy}
        style={styles.passage}
      >
        <SFProBody variant="rowDetail" tone="textSupporting">
          {`From ${reference}`}
        </SFProBody>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caps: { textTransform: "uppercase" },
  field: {
    borderWidth: 1,
    borderRadius: radius[20],
    padding: space[18],
    minHeight: FIELD_LEAST,
    textAlignVertical: "top",
  },
  passage: { alignSelf: "flex-start" },
});
