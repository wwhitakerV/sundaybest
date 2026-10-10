import { useRef, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, View } from "react-native";

import { useKeyboardOverlap } from "@/hooks/use-keyboard-overlap";
import { useScrollToEnd } from "@/hooks/use-scroll-to-end";
import { controlHeight, radius, space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { BottomSheet } from "@/ui/organisms/BottomSheet";
import { KeyboardBar } from "@/ui/organisms/KeyboardBar";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";
import { TextField } from "@/ui/typography/TextField";
import { PartLabel } from "./PartLabel";

/** Nearly the whole screen: room to read it back and write beneath it. */
const SHEET_HEIGHT = 0.95;
/** Room at the end of what scrolls for the Done bar over it: the button, and its gaps. */
const BAR_ROOM = controlHeight.button + space[16] * 2;
/** The Study's answer box's least height: room for a few lines. */
const FIELD_LEAST = 124;

export type ReflectionSheetProps = {
  visible: boolean;
  /** "Thursday, August 27": the day it was written. */
  date: string;
  question: string;
  answer: string;
  /** The updates from days before, each with its date. */
  lines: readonly { writtenOn: string; date: string; text: string }[];
  /** Today's update, as saved: where the box starts when the sheet opens. */
  text: string;
  /** Each change to it, saved as it's typed. */
  onChange: (text: string) => void;
  onClose: () => void;
};

/**
 * Adding to a reflection, on a sheet over nearly all the screen: the
 * reflection read back — what was asked, what was written, the updates since
 * — and under it the Study's own answer box for today's, the keyboard up,
 * saved as it's typed. The original is never changed. Done, on the
 * keyboard, keeps it; the X beside the title puts back what was there.
 */
export function ReflectionSheet({
  visible,
  date,
  question,
  answer,
  lines,
  text,
  onChange,
  onClose,
}: ReflectionSheetProps) {
  const theme = useTheme();
  // What's typed lives here, so the box answers each key at once; every change is saved as it's
  // made. Taken afresh from what's saved each time the sheet opens.
  const [draft, setDraft] = useState(text);
  // What was saved when it opened: the X puts it back, as if nothing had been typed.
  const [opened, setOpened] = useState(text);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(text);
      setOpened(text);
    }
  }
  // The keyboard's room comes from the keyboard itself, not from where the sheet is: it rises
  // while the sheet is still sliding up, and measuring the sheet then shoved everything out of
  // reach. With the keyboard up, the box is brought into view above Done; the rest scrolls back.
  const keyboard = useKeyboardOverlap();
  const scroll = useRef<ScrollView>(null);
  useScrollToEnd(scroll, keyboard > 0 ? keyboard : null);
  const done = () => {
    Keyboard.dismiss();
    onClose();
  };
  const type = (next: string) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <BottomSheet
      testID="your-words-sheet"
      accessibilityLabel="Add to your reflection"
      visible={visible}
      onClose={onClose}
      heightRatio={SHEET_HEIGHT}
      // The keyboard goes with it, whichever way it's left.
      onDiscard={() => {
        Keyboard.dismiss();
        if (draft !== opened) onChange(opened);
        onClose();
      }}
    >
      <ScrollView
        ref={scroll}
        style={styles.fill}
        // Its end clears the Done bar on the keyboard.
        contentContainerStyle={{ gap: space[24], paddingBottom: BAR_ROOM + keyboard }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: space[6] }}>
          <PartLabel>You were asked</PartLabel>
          <SFProBody variant="reading">{question}</SFProBody>
        </View>
        <View style={{ gap: space[6] }}>
          <PartLabel>{`You wrote · ${date}`}</PartLabel>
          <SerifBody variant="standfirst">
            <Span italic>{answer}</Span>
          </SerifBody>
        </View>
        {lines.map((line) => (
          <View key={line.writtenOn} style={{ gap: space[6] }}>
            <MonoLabel variant="labelTracked" tone="textMuted" style={styles.caps}>
              {line.date}
            </MonoLabel>
            <SerifBody variant="line">{line.text}</SerifBody>
          </View>
        ))}
        <View style={{ gap: space[6] }}>
          <PartLabel>Today</PartLabel>
          <TextField
            testID="your-words-line"
            accessibilityLabel="An update today"
            value={draft}
            onChangeText={type}
            placeholder="What would you add now?"
            multiline
            autoFocus
            // The Study's own answer box.
            style={[
              styles.field,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
            ]}
          />
        </View>
      </ScrollView>
      {/* On the keyboard, as a search's field rides it; at the sheet's foot once it's put away. */}
      <KeyboardBar testID="your-words-sheet-bar">
        <View style={styles.fill}>
          <Button testID="your-words-sheet-done" label="Done" onPress={done} />
        </View>
      </KeyboardBar>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  caps: { textTransform: "uppercase" },
  field: {
    borderWidth: 1,
    borderRadius: radius[20],
    padding: space[18],
    minHeight: FIELD_LEAST,
    textAlignVertical: "top",
  },
});
