import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { CircleCheck, CircleX } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { toneColor } from "@/ui/typography/tone";
import { FLOATING_NAV_BAR, getFloatingNavBarBottom } from "./floatingNavBar";
import { PAGE_INSET } from "./Screen";

export type FeedbackPanelProps = {
  testID: string;
  /** Whether it went right — its colour, and its icon. */
  tone: "correct" | "incorrect";
  title: string;
  /** Why, under the title. */
  detail?: string;
  /** The way on: its button. */
  children: ReactNode;
};

/**
 * A verdict at the foot of a page, in its colour: a solid mark (a tick, or an
 * X) and a title, why, and the way on. `ScrollFrame` pins it to the screen's bottom in the dock's
 * place; it runs just past the screen's edges with rounded top corners, its
 * words at the page inset and its button exactly where the dock's sits. A
 * quiz answer checked, a link that won't work.
 */
export function FeedbackPanel({ testID, tone, title, detail, children }: FeedbackPanelProps) {
  const theme = useTheme();
  // Its button where the dock's pill sits; its colour runs on under the home indicator.
  const capsuleBottom = getFloatingNavBarBottom(useContext(SafeAreaInsetsContext)?.bottom ?? 0);
  const right = tone === "correct";
  const Icon = right ? CircleCheck : CircleX;

  return (
    <View
      testID={testID}
      style={[
        styles.panel,
        { paddingBottom: capsuleBottom + EDGE },
        {
          backgroundColor: right ? theme.colors.correctSurface : theme.colors.incorrectSurface,
          borderColor: right ? theme.colors.correctBorder : theme.colors.incorrectBorder,
        },
      ]}
    >
      <View testID={`${testID}-words`} style={styles.words}>
        <View style={styles.verdict}>
          {/* A solid disc in the verdict's colour, its mark cut out of it: the cue that reads first. */}
          <Icon
            size={VERDICT_ICON}
            fill={toneColor(theme.colors, tone)}
            color={theme.colors.background}
            strokeWidth={theme.icon.strokeWidthStrong}
          />
          <SFProTitle variant="headline" tone={tone}>
            {title}
          </SFProTitle>
        </View>
        {detail ? <SFProBody tone={tone}>{detail}</SFProBody> : null}
      </View>
      <View testID={`${testID}-action`} style={styles.action}>
        {children}
      </View>
    </View>
  );
}

/** The verdict's mark beside its title: a touch larger than an icon in a line, to be seen first. */
const VERDICT_ICON = 26;

/**
 * The panel's edge. It's drawn all the way round — a top edge alone fades out
 * where the corners curve — and the panel reaches this far past the screen's
 * sides and bottom, so only its top and the curves show.
 */
const EDGE = 1;

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: -EDGE,
    marginBottom: -EDGE,
    paddingHorizontal: FLOATING_NAV_BAR.sideMargin + EDGE,
    paddingTop: space[24],
    gap: space[16],
    borderWidth: EDGE,
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
  },
  // The words keep the page inset; only the button comes out to the dock's.
  words: { paddingHorizontal: PAGE_INSET - FLOATING_NAV_BAR.sideMargin, gap: space[16] },
  verdict: { flexDirection: "row", alignItems: "center", gap: space[10] },
  action: { height: FLOATING_NAV_BAR.capsuleHeight, justifyContent: "center" },
});
