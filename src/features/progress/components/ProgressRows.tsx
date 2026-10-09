import { Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";

/**
 * Each row's picture sits in this slot: small and fixed, a symbol of what the
 * row holds rather than a chart of it, so it never crowds the words.
 */
const PICTURE = { width: 28, height: 20 } as const;
/**
 * The Word's symbol: a few bars of varied heights — dark for days of study,
 * a lighter grey for the rest — against the card's grey.
 */
const BARS = [
  { height: 13, studied: true },
  { height: 8, studied: false },
  { height: 17, studied: true },
  { height: 6, studied: true },
  { height: 11, studied: false },
  { height: 15, studied: true },
] as const;
const BAR_WIDTH = 2;
/** Quick Check's symbol: answers in three rows of four — mostly right, some missed — in the results' green and red. */
const ANSWERS = [
  [true, true, false, true],
  [true, false, true, true],
  [true, true, true, false],
] as const;
const DOT = 5;
/** Your words' symbol: a few lines of writing, of uneven lengths, the last one short. */
const LINES = [28, 22, 14] as const;
const LINE_HEIGHT = 2;
/** Settings' chevron, as its rows end. */
const CHEVRON = 18;
/** A row's least height: Settings' rows'. */
const MIN_ROW_HEIGHT = 64;

export type ProgressRowsProps = {
  /** "23 passages across 9 books" — or null before the first. */
  word: string | null;
  /** "17 reflections, kept on this phone" — always there, even before the first. */
  words: string;
  /** Quick Check's line, as its results say it: "14 right · 4 missed" — or null before the first. */
  quickCheck: string | null;
};

/**
 * What the reader has gathered, in all, on one card as Settings groups its
 * rows: each its name and one line — never two — and a small symbol of it in
 * a fixed slot: bars for the Word, lines of writing for their words, Quick
 * Check's right and missed as a grid of dots — and Settings' chevron. Your words is always there; the others once
 * there's something in them. Their pages aren't linked yet.
 */
export function ProgressRows({ word, words, quickCheck }: ProgressRowsProps) {
  const theme = useTheme();
  const rows: { key: string; title: string; line: string; picture: ReactNode }[] = [];

  if (word) {
    rows.push({
      key: "word",
      title: "The Word",
      line: word,
      picture: (
        <View style={styles.bars}>
          {BARS.map((bar, index) => (
            <View
              // A symbol's bars in a fixed order: a bar's place is its identity.
              key={`bar-${index}`}
              style={{
                width: BAR_WIDTH,
                height: bar.height,
                backgroundColor: bar.studied ? theme.colors.text : theme.colors.textMuted,
              }}
            />
          ))}
        </View>
      ),
    });
  }
  rows.push({
    key: "words",
    title: "Your words",
    line: words,
    picture: (
      <View style={[styles.lines, { gap: space[4] }]}>
        {LINES.map((width, index) => (
          <View
            // A symbol's lines in a fixed order: a line's place is its identity.
            key={`line-${index}`}
            style={{
              width,
              height: LINE_HEIGHT,
              borderRadius: radius.pill,
              backgroundColor: theme.colors.text,
            }}
          />
        ))}
      </View>
    ),
  });
  if (quickCheck) {
    rows.push({
      key: "quickCheck",
      title: "Quick Check",
      line: quickCheck,
      picture: (
        <View style={{ gap: space[2] }}>
          {ANSWERS.map((line, row) => (
            <View
              // A symbol's rows in a fixed order: a row's place is its identity.
              key={`answers-${row}`}
              style={styles.answers}
            >
              {line.map((right, column) => (
                <View
                  key={`answer-${row}-${column}`}
                  style={[
                    styles.dot,
                    {
                      borderRadius: radius.pill,
                      backgroundColor: right ? theme.colors.correct : theme.colors.incorrect,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      ),
    });
  }

  return (
    <View
      testID="progress-rows"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.containerBorder,
          borderRadius: radius[24],
        },
      ]}
    >
      {rows.map((row, index) => (
        <Fragment key={row.key}>
          {index > 0 && <Divider />}
          <View
            testID={`progress-row-${row.key}`}
            style={[
              styles.row,
              { gap: space[16], paddingHorizontal: space[16], paddingVertical: space[14] },
            ]}
          >
            <View style={[styles.copy, { gap: space[2] }]}>
              <SFProBody numberOfLines={1}>{row.title}</SFProBody>
              <SFProBody variant="rowDetail" tone="textSupporting" numberOfLines={1}>
                {row.line}
              </SFProBody>
            </View>
            <View style={styles.picture}>{row.picture}</View>
            <ChevronRight
              size={CHEVRON}
              color={theme.colors.textMuted}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Settings' group card: the soft fill, its edge, rows on it with hairlines between.
  card: { borderWidth: 1, overflow: "hidden" },
  row: { minHeight: MIN_ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
  // Every symbol fills the slot's width, so their edges line up row to row.
  picture: { ...PICTURE, justifyContent: "center" },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: PICTURE.height,
  },
  lines: { alignItems: "flex-start" },
  answers: { flexDirection: "row", justifyContent: "space-between" },
  dot: { width: DOT, height: DOT },
});
