import { useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, type View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { usesTwentyFourHourClock } from "@/core/localization/clock";
import { controlHeight, radius, space, useTheme } from "@/theme";
import { Popover, type PopoverAnchor } from "@/ui/organisms/Popover";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { formatClockTime } from "@/utils/time/formatClockTime";
import { dateForTime, toLocalTime } from "../logic/reminder-time";

/** Between the pill and the popover hanging under it. */
const POPOVER_GAP = 8;
/** iOS's own time pill height; its slop makes up the full tap target. */
const PILL_HEIGHT = 36;
const PILL_SLOP = (controlHeight.hitTarget - PILL_HEIGHT) / 2;

export type ReminderTimeProps = {
  /** "06:30". */
  time: string;
  /** A new time, once the popover closes on one. */
  onChange: (time: string) => void;
  testID: string;
};

/**
 * The reminder's time: a pill with the time, opening the app's `Popover`
 * under it with the time's wheel. What's spun is saved as the popover
 * closes, and only if it changed.
 */
export function ReminderTime({ time, onChange, testID }: ReminderTimeProps) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const pill = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<PopoverAnchor>({ top: 0, right: PAGE_INSET });
  // The wheel's time while it's open; one Date, so it isn't handed a new one each render.
  const [draft, setDraft] = useState(() => dateForTime(time));

  function show() {
    setDraft(dateForTime(time));
    // Hung under the pill, its right edge in line with the pill's.
    pill.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + POPOVER_GAP, right: window.width - (x + width) });
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    const picked = toLocalTime(draft);
    if (picked !== time) onChange(picked);
  }

  const shown = open ? toLocalTime(draft) : time;
  // Written as the iPhone writes times, so it matches the wheel it opens.
  const label = formatClockTime(shown, { twentyFourHour: usesTwentyFourHourClock() });

  return (
    <>
      <Pressable
        ref={pill}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Reminder time, ${label}`}
        onPress={show}
        hitSlop={PILL_SLOP}
        style={({ pressed }) => [
          styles.pill,
          {
            borderRadius: radius.pill,
            paddingHorizontal: space[14],
            backgroundColor: pressed
              ? theme.colors.segmentActiveBackground
              : theme.colors.segmentBackground,
          },
        ]}
      >
        <SFProBody>{label}</SFProBody>
      </Pressable>

      {/*
        No width: the popover hugs the wheel. iOS sizes the wheel itself — the
        picker overrides any size given it — so a set width either clipped its
        right side or left its columns off-centre.
      */}
      <Popover
        testID={`${testID}-popover`}
        accessibilityLabel="Reminder time"
        visible={open}
        onClose={close}
        anchor={anchor}
      >
        <DateTimePicker
          testID={`${testID}-picker`}
          value={draft}
          mode="time"
          display="spinner"
          onValueChange={(_event, date) => setDraft(date)}
          themeVariant={theme.name}
          textColor={theme.colors.text}
        />
      </Popover>
    </>
  );
}

const styles = StyleSheet.create({
  pill: { height: PILL_HEIGHT, justifyContent: "center" },
});
