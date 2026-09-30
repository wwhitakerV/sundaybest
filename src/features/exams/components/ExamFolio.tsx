import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight, BookOpen } from "lucide-react-native";

import { useTheme } from "@/theme";
import {
  formatExamCountInWords,
  formatLevelName,
  formatSubjectNumber,
  getFolioTier,
} from "../logic/catalog";
import type { Subject } from "../types";
import { FolioExamRow } from "./FolioExamRow";
import { FOLIO_FONT_CAP } from "./folio-print";
import GRAIN from "../../../../assets/images/exams/folio-grain.png";

const RADIUS = 10;
/** The black spine down the cover's left edge, as wide as the gap to the accent rule. */
const SPINE = 12;
/** A book's measures, as designed — its padding, the kicker-to-title gap, the "Four exams" line — and on a compact one. */
const REGULAR = {
  padding: { top: 27, right: 25, bottom: 18, left: 27 - SPINE },
  titleGap: 22,
  sectionHeight: 44,
} as const;
const COMPACT = {
  padding: { top: 20, right: 20, bottom: 12, left: 22 - SPINE },
  titleGap: 10,
  sectionHeight: 32,
} as const;
const HEADING_BOTTOM = 14;
const KICKER_ICON = 24;
/** The fine paper grain over the cloth: faint. */
const GRAIN_OPACITY = 0.09;
/** SundayBest's signature: a short accent rule down from the top edge, against the spine. */
const SIGNATURE = { width: 2, height: 40 } as const;
const TRACKING = { textTransform: "uppercase" } as const;
/** The "Open subject" line at the book's foot. */
const FOOTER_HEIGHT = 36;
const FOOTER_ICON = 16;

/** Decoration only: VoiceOver passes over it. */
const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type ExamFolioProps = {
  subject: Subject;
  /** Its place among the subjects, from 0. */
  index: number;
  width: number;
  height: number;
  /** Whether it's the book in view: pressed, it opens; otherwise it's brought into view. */
  inView: boolean;
  onPress: () => void;
  testID: string;
};

/**
 * A subject as a bound book — made in full, the same whether it's in view
 * or not, so a swipe only ever slides it. A near-black cloth cover bound
 * with a black spine, a fine grain, and SundayBest's accent rule against
 * the spine at its top: its number and name
 * in the mono, its title large in the editorial face over a rule, how many
 * exams it holds, and each exam's level and title (`FolioExamRow`), sharing
 * the room that's left. The whole book is one button. On a shorter screen
 * it's set compact (`getFolioTier`) so it always fits.
 */
export function ExamFolio({
  subject,
  index,
  width,
  height,
  inView,
  onPress,
  testID,
}: ExamFolioProps) {
  const theme = useTheme();
  const regular = getFolioTier(height) === "regular";
  const set = regular ? REGULAR : COMPACT;
  const { padding } = set;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${subject.title}. ${formatExamCountInWords(subject.exams.length)}`}
      accessibilityHint={inView ? "Opens this subject's exams" : "Brings this subject into view"}
      onPress={onPress}
      style={[
        styles.folio,
        {
          width,
          height,
          paddingTop: padding.top,
          paddingRight: padding.right,
          paddingBottom: padding.bottom,
          paddingLeft: padding.left,
          backgroundColor: theme.colors.folioCloth,
          borderColor: theme.colors.folioClothEdge,
          borderLeftWidth: SPINE,
          borderLeftColor: theme.palette.frostOnDark,
          shadowColor: theme.colors.shadow,
          ...theme.elevation.folio,
        },
      ]}
    >
      {/* Clipped to the cover's corners on its own, so the shadow outside isn't; sized in points, so it tiles. */}
      <View pointerEvents="none" style={styles.grain} {...HIDDEN}>
        <Image
          source={GRAIN}
          resizeMode="repeat"
          style={{ width, height, opacity: GRAIN_OPACITY }}
        />
      </View>
      {/* Placed inside the spine, so at 0 it's against it. */}
      <View
        testID={`${testID}-signature`}
        style={[styles.signature, { backgroundColor: theme.colors.accent }]}
        {...HIDDEN}
      />

      <View
        style={[
          styles.heading,
          { borderBottomColor: theme.colors.folioRule, paddingBottom: HEADING_BOTTOM },
        ]}
      >
        <View style={styles.kickerRow}>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={FOLIO_FONT_CAP}
            style={[
              theme.typography.folioMeta,
              TRACKING,
              styles.kicker,
              { color: theme.colors.folioInkMuted },
            ]}
          >
            {`${formatSubjectNumber(index)} / ${subject.title}`}
          </Text>
          <View {...HIDDEN}>
            <BookOpen
              size={KICKER_ICON}
              color={theme.colors.folioInk}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        </View>
        <Text
          numberOfLines={2}
          maxFontSizeMultiplier={FOLIO_FONT_CAP}
          style={[
            regular ? theme.typography.folioTitle : theme.typography.folioTitleCompact,
            { color: theme.colors.folioInk, marginTop: set.titleGap },
          ]}
        >
          {subject.title}
        </Text>
      </View>

      <View style={[styles.section, { height: set.sectionHeight }]}>
        <Text
          maxFontSizeMultiplier={FOLIO_FONT_CAP}
          style={[theme.typography.folioMeta, TRACKING, { color: theme.colors.folioInkMuted }]}
        >
          {formatExamCountInWords(subject.exams.length)}
        </Text>
      </View>

      <View style={styles.rows}>
        {subject.exams.map((exam, row) => (
          <FolioExamRow
            key={exam.examId}
            testID={`exams-item-${exam.examId}`}
            level={formatLevelName(exam.level)}
            title={exam.title}
            ruled={row > 0}
            titleLines={regular ? 2 : 1}
          />
        ))}
      </View>

      {/* Says the book opens: its exams above are print, and the book is the button. */}
      <View
        testID={`${testID}-open`}
        style={[styles.footer, { borderTopColor: theme.colors.folioRule }]}
      >
        <Text
          maxFontSizeMultiplier={FOLIO_FONT_CAP}
          style={[theme.typography.folioMeta, TRACKING, { color: theme.colors.folioInk }]}
        >
          Open subject
        </Text>
        <ArrowRight
          size={FOOTER_ICON}
          color={theme.colors.folioInk}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  folio: { borderRadius: RADIUS, borderWidth: 1 },
  // Inside the spine, square on its left, rounded with the cover on its right.
  grain: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    overflow: "hidden",
  },
  signature: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SIGNATURE.width,
    height: SIGNATURE.height,
  },
  heading: { borderBottomWidth: 1 },
  kickerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  kicker: { flexShrink: 1 },
  section: { justifyContent: "center" },
  // What's left of the book below its heading, shared by its exams; nothing spills past its foot.
  rows: { flex: 1, overflow: "hidden" },
  footer: {
    height: FOOTER_HEIGHT,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
