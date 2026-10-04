import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { CircleCheck, CircleX } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { toneColor } from "@/ui/typography/tone";
import { PAGE_INSET } from "./Screen";
import { FOOTER_BOTTOM } from "./ScreenFooter";

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
 * A verdict at the foot of a padded screen, in its colour: an icon and a
 * title, why, and the way on. It runs to the screen's edges, past the page
 * inset, with rounded top corners, and on under the home indicator — in place
 * of the screen's own action. A quiz answer checked, a link that won't work.
 */
export function FeedbackPanel({ testID, tone, title, detail, children }: FeedbackPanelProps) {
  const theme = useTheme();
  // The screen keeps clear of the home indicator; the panel's colour runs on under it.
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const right = tone === "correct";
  const Icon = right ? CircleCheck : CircleX;

  return (
    <View
      testID={testID}
      style={[
        styles.panel,
        // Its button lands where a `ScreenFooter`'s would, so it never moves.
        { marginBottom: -(bottomInset + EDGE), paddingBottom: bottomInset + EDGE + FOOTER_BOTTOM },
        {
          backgroundColor: right ? theme.colors.correctSurface : theme.colors.incorrectSurface,
          borderColor: right ? theme.colors.correctBorder : theme.colors.incorrectBorder,
        },
      ]}
    >
      <View style={styles.verdict}>
        <Icon
          size={22}
          color={toneColor(theme.colors, tone)}
          strokeWidth={theme.icon.strokeWidth}
        />
        <SFProTitle variant="headline" tone={tone}>
          {title}
        </SFProTitle>
      </View>
      {detail ? <SFProBody tone={tone}>{detail}</SFProBody> : null}
      {children}
    </View>
  );
}

/**
 * The panel's edge. It's drawn all the way round — a top edge alone fades out
 * where the corners curve — and the panel reaches this far past the screen's
 * sides and bottom, so only its top and the curves show.
 */
const EDGE = 1;

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: -(PAGE_INSET + EDGE),
    paddingHorizontal: PAGE_INSET + EDGE,
    paddingTop: space[24],
    gap: space[16],
    borderWidth: EDGE,
    borderTopLeftRadius: radius[36],
    borderTopRightRadius: radius[36],
  },
  verdict: { flexDirection: "row", alignItems: "center", gap: space[10] },
});
