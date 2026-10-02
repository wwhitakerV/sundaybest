import { StyleSheet, View } from "react-native";

import type { ReadingPaper } from "@/types/domain";
import { READING_TEXT_SIZE } from "@/core/store";
import { space } from "@/theme";
import { StepScale } from "@/ui/molecules/StepScale";
import { BottomSheet } from "@/ui/organisms/BottomSheet";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { describeTextOffset } from "../logic/reading";
import { PaperPicker } from "./PaperPicker";

export type ReadingSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Points from the study text's designed size (`READING_TEXT_SIZE`). */
  textOffset: number;
  onTextOffsetChange: (offset: number) => void;
  paper: ReadingPaper;
  onPaperChange: (paper: ReadingPaper) => void;
};

/**
 * The study's reading sheet: the text's size, a step at a time between a
 * small A and a large one, and the paper it's read on. Every change shows on
 * the page behind it at once.
 */
export function ReadingSheet({
  visible,
  onClose,
  textOffset,
  onTextOffsetChange,
  paper,
  onPaperChange,
}: ReadingSheetProps) {
  return (
    <BottomSheet
      testID="study-reading-sheet"
      accessibilityLabel="Text size and paper"
      visible={visible}
      onClose={onClose}
    >
      <View style={styles.section}>
        <MonoLabel tone="textMuted">Text size</MonoLabel>
        <StepScale
          testID="study-reading-text-size"
          accessibilityLabel="Text size"
          value={textOffset}
          min={READING_TEXT_SIZE.min}
          max={READING_TEXT_SIZE.max}
          step={READING_TEXT_SIZE.step}
          onChange={onTextOffsetChange}
          valueText={describeTextOffset}
        />
      </View>
      <View style={styles.section}>
        <MonoLabel tone="textMuted">Paper</MonoLabel>
        <PaperPicker testID="study-reading-paper" selected={paper} onSelect={onPaperChange} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[12] },
});
