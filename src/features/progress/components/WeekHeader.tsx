import { useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { ChevronDown } from "lucide-react-native";

import { controlHeight, radius, space, useTheme } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import type { PopoverAnchor } from "@/ui/organisms/Popover";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import type { WeekOption } from "../logic/week-picker";
import type { weeksHref } from "../logic/progress-route";
import { WeekPicker } from "./WeekPicker";

/** Between the dates and the popover hanging under them. */
const PICKER_GAP = space[8];
/** The dates' pill: Daily reminder's time pill's height; its slop makes up the full tap target. */
const PILL_HEIGHT = 36;
const PILL_SLOP = (controlHeight.hitTarget - PILL_HEIGHT) / 2;
const CHEVRON = 14;

/** What the dates open: a few weeks in a popover, or — past four — the full-screen weeks. */
export type WeekHeaderPicker =
  | { mode: "popover"; options: readonly WeekOption[]; selected: string }
  | { mode: "browse"; href: ReturnType<typeof weeksHref> };

export type WeekHeaderProps = {
  /** Where the week's study comes from: "From VOUS Church", "Three plans". */
  source: string | null;
  title: string;
  /** "Oct 4 – 10". */
  range: string;
  picker: WeekHeaderPicker;
  onPickWeek: (weekStart: string) => void;
  /** Development builds only: the picker's made-up histories, stepped through by a button. */
  preview?: { name: string; next: () => void } | null;
};

/**
 * The week's head: where its study comes from, small, and its dates — dark
 * and firm on Daily reminder's soft pill — over its title in the serif. The
 * dates open a popover of a few weeks, or, past four, zoom out into the
 * full-screen weeks.
 */
export function WeekHeader({ source, title, range, picker, onPickWeek, preview }: WeekHeaderProps) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const dates = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<PopoverAnchor>({ top: 0, right: PAGE_INSET });

  function show() {
    // Hung under the dates, its right edge in line with theirs.
    dates.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + PICKER_GAP, right: window.width - (x + width) });
    });
    setOpen(true);
  }

  const pill = (pressed: boolean) => (
    <View
      // One flattened style, not a list: the zoom's link hands the pill's style on, and takes only one.
      style={StyleSheet.flatten([
        styles.row,
        styles.pill,
        {
          gap: space[6],
          borderRadius: radius.pill,
          paddingHorizontal: space[14],
          backgroundColor: pressed
            ? theme.colors.segmentActiveBackground
            : theme.colors.segmentBackground,
        },
      ])}
    >
      <MonoLabel variant="labelTrackedStrong" style={styles.caps}>
        {range}
      </MonoLabel>
      <ChevronDown size={CHEVRON} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </View>
  );

  return (
    <View testID="progress-week-header" style={{ gap: space[6] }}>
      <View style={[styles.row, { gap: space[12] }]}>
        <View style={styles.source}>
          {preview ? (
            <View style={styles.start}>
              <CompactButton
                testID="progress-week-preview"
                label={`Preview: ${preview.name}`}
                tone="soft"
                onPress={preview.next}
              />
            </View>
          ) : (
            <MonoLabel variant="labelTracked" tone="textMuted" style={styles.caps}>
              {source ?? ""}
            </MonoLabel>
          )}
        </View>
        {picker.mode === "browse" ? (
          // The weeks zoom out of the dates, and back into them (iOS 18's zoom).
          // `asChild`: the link hands its press to the pill itself, which the zoom grows from.
          <Link href={picker.href} asChild>
            <Link.AppleZoom>
              <Pressable
                testID="progress-week-range"
                accessibilityRole="button"
                accessibilityLabel={`${range}. Find a week`}
                hitSlop={PILL_SLOP}
              >
                {pill(false)}
              </Pressable>
            </Link.AppleZoom>
          </Link>
        ) : (
          <Pressable
            ref={dates}
            testID="progress-week-range"
            accessibilityRole="button"
            accessibilityLabel={`${range}. Choose a week`}
            hitSlop={PILL_SLOP}
            onPress={show}
          >
            {({ pressed }) => pill(pressed)}
          </Pressable>
        )}
      </View>
      <SerifTitle variant="title" accessibilityRole="header" numberOfLines={2}>
        {title}
      </SerifTitle>
      {picker.mode === "popover" && (
        <WeekPicker
          visible={open}
          onClose={() => setOpen(false)}
          anchor={anchor}
          options={picker.options}
          selected={picker.selected}
          onPick={onPickWeek}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  source: { flex: 1 },
  start: { alignSelf: "flex-start" },
  pill: { height: PILL_HEIGHT },
  caps: { textTransform: "uppercase" },
});
