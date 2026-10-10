import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BookOpen, Pencil } from "lucide-react-native";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { controlHeight, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";
import { ModulePlanRow } from "./ModulePlanRow";
import { ModuleActions } from "./ModuleActions";
import { PartLabel } from "./PartLabel";
import { panelEnter } from "./panel-enter";

/** The pencil by "You wrote": a row's icon, a little smaller beside its label. */
const PENCIL = 18;

export type ReflectionViewProps = {
  /** "Six weeks ago". */
  ago: string;
  /** "Thursday, August 27". */
  date: string;
  planTitle: string;
  thumbnailUrl: string | null;
  question: string;
  answer: string;
  /** Lines added since, each with its date. */
  lines: readonly { writtenOn: string; date: string; text: string }[];
  /** The pencil in "You wrote": add to it, on a sheet. */
  onEdit: () => void;
  /** "Open Day 3". */
  studyLabel: string;
  onOpenStudy: () => void;
};

/**
 * One reflection, as one module on Settings' group card — a line between its
 * parts, as Quick Check's missed questions are: the plan, by its artwork and
 * title; what was asked, as the study asked it; what was written, whole, in
 * the Scripture face's italic, a pencil beside it to add to it (on a sheet);
 * the lines added since, each dated, the original never changed. Hung from
 * it, the day's study, as a pill. Over it, how long ago and the day. It arrives fading in
 * as it rises (`panelEnter`).
 */
export function ReflectionView({
  ago,
  date,
  planTitle,
  thumbnailUrl,
  question,
  answer,
  lines,
  onEdit,
  studyLabel,
  onOpenStudy,
}: ReflectionViewProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const row = [styles.row, { gap: space[6], padding: space[16] }];

  return (
    <Animated.View
      testID="your-words-reflection"
      entering={panelEnter(reduceMotion)}
      style={{ gap: space[8] }}
    >
      <SFProBody variant="label" tone="text" style={styles.when}>
        {`${ago} · ${date}`}
      </SFProBody>
      {/* The card and what hangs from it, together: the line leaves the card's very edge. */}
      <View>
        <Card radius={24} style={styles.card}>
          <ModulePlanRow title={planTitle} thumbnailUrl={thumbnailUrl} />
          <Divider />
          <View style={row}>
            <PartLabel>You were asked</PartLabel>
            <SFProBody variant="reading">{question}</SFProBody>
          </View>
          <Divider />
          <View style={row}>
            <View style={styles.wroteHead}>
              <PartLabel>You wrote</PartLabel>
              <Pressable
                testID="your-words-edit"
                accessibilityRole="button"
                accessibilityLabel="Add to what you wrote"
                hitSlop={(controlHeight.hitTarget - PENCIL) / 2}
                onPress={onEdit}
              >
                <Pencil
                  size={PENCIL}
                  color={theme.colors.textSupporting}
                  strokeWidth={theme.icon.strokeWidthStrong}
                />
              </Pressable>
            </View>
            <SerifBody variant="standfirst">
              <Span italic>{answer}</Span>
            </SerifBody>
          </View>
          {lines.map((line) => (
            <View key={line.writtenOn}>
              <Divider />
              <View style={row}>
                <MonoLabel variant="labelTracked" tone="textMuted" style={styles.caps}>
                  {line.date}
                </MonoLabel>
                <SerifBody variant="line">{line.text}</SerifBody>
              </View>
            </View>
          ))}
        </Card>
        {/* Hung from the card: the day's study, a line down into it. */}
        <ModuleActions
          primary={{
            testID: "your-words-study",
            label: studyLabel,
            icon: BookOpen,
            onPress: onOpenStudy,
          }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caps: { textTransform: "uppercase" },
  // In line with the words inside the card, and clear of the rounded edge it scrolls under.
  when: { paddingHorizontal: space[16] },
  card: { overflow: "hidden" },
  row: { alignItems: "stretch" },
  // Its label, and at the row's end the pencil that adds to it.
  wroteHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
