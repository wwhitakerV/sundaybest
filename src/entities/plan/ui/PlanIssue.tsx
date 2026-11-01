import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { MoveRight } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { Span } from "@/ui/typography/Span";
import { DayMarks } from "./DayMarks";
import { FEATURE_ARTWORK_RADIUS, type FeaturePart } from "./PlanFeature";

/** Its title and the line from it, at most this long: the lead stays one height, and reads at a glance. */
const LINES = { title: 2, standfirst: 2 };
/** Continue's least width: a short word ("Start") never looks stubby beside the days. */
const ACTION_MIN_WIDTH = 110;

/**
 * A line from the plan, labelled so it explains itself: what it is (`lead`:
 * "Reflect", "Takeaway"), whether it's the step waiting now (`now`), and its
 * words.
 */
type Standfirst = { lead: string; now: boolean; text: string; quoted: boolean };

/** A plan featured as an issue of the library. */
type IssuePlan = {
  title: string;
  /** The series its sermon is from, and which part, under its title ("Unshakable · Part II"); none when it names none. */
  series?: string | null;
  thumbnailUrl: string | null;
  /** The line over its title: its church and its Scripture ("GRACE CHURCH · ACTS 1:4–8"). */
  folio: string;
  standfirst: Standfirst | null;
  /** Its days: how many, how many done, and the one it's on. */
  days: { total: number; done: number; current: number | null };
  /** The way on — "Continue", "Start", or "Tomorrow" while it waits — and whether it leads on (its arrow). */
  action: { label: string; onward: boolean };
  waiting: boolean;
};

export type PlanIssueProps = {
  plan: IssuePlan;
  onContinue: () => void;
  /** The artwork as the page sets it — a link into the plan. */
  frameArtwork?: (artwork: ReactNode) => ReactNode;
  /** Its days and Continue, measured where they sit (Plans hands Continue to the tab bar out of view). */
  action?: FeaturePart;
  testID: string;
};

/**
 * A plan featured as the library's lead, set to read at a glance and to
 * fit an SE's screen: the sermon's 16:9 artwork; its church and Scripture
 * in tracked capitals; its title in Canela Deck, and under it, small and
 * grey, the series its sermon is from; a line from it in the reading face's
 * italic, run in after its label and a colon — the step waiting, its name in
 * the accent, or its first takeaway; and, under a rule, its foot — its days led by "DAY", those done
 * in ink and the day it's on in the accent, opposite a black Continue
 * carrying a long arrow set as one of its words.
 */
export function PlanIssue({ plan, onContinue, frameArtwork, action, testID }: PlanIssueProps) {
  const theme = useTheme();
  const artwork = <VideoThumbnail uri={plan.thumbnailUrl} style={styles.artwork} />;

  return (
    <View testID={testID} style={styles.issue}>
      {frameArtwork ? frameArtwork(artwork) : artwork}

      <View style={styles.words}>
        <MonoLabel variant="labelTracked" tone="textSupporting" testID={`${testID}-folio`}>
          {plan.folio}
        </MonoLabel>
        <SerifTitle
          variant="issue"
          accessibilityRole="header"
          numberOfLines={LINES.title}
          testID={`${testID}-title`}
        >
          {plan.title}
        </SerifTitle>
        {plan.series && (
          <SFProBody variant="rowDetail" tone="textSupporting" testID={`${testID}-series`}>
            {plan.series}
          </SFProBody>
        )}
        {plan.standfirst && (
          <IssueStandfirst standfirst={plan.standfirst} testID={`${testID}-standfirst`} />
        )}
      </View>

      <Animated.View onLayout={action?.onLayout} style={action?.style}>
        <View
          ref={action?.ref}
          collapsable={false}
          style={[styles.onward, { borderTopColor: theme.colors.divider }]}
        >
          <DayMarks
            testID={`${testID}-days`}
            total={plan.days.total}
            done={plan.days.done}
            current={plan.days.current}
            labelled
          />
          <CompactButton
            testID={`${testID}-continue`}
            label={plan.action.label}
            {...(plan.action.onward && { icon: MoveRight, iconPosition: "end" as const })}
            typeset
            minWidth={ACTION_MIN_WIDTH}
            tone={plan.waiting ? "waiting" : "dark"}
            onPress={onContinue}
          />
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * The line from the plan, as a magazine runs one in: its label in tracked
 * capitals and a colon — in the accent when it's the step waiting, as the
 * day it's on is; grey for its takeaway — then its words in italic.
 */
function IssueStandfirst({ standfirst, testID }: { standfirst: Standfirst; testID: string }) {
  const { lead, now, text, quoted } = standfirst;
  return (
    <SerifBody
      testID={testID}
      variant="line"
      tone="text"
      numberOfLines={LINES.standfirst}
      style={styles.standfirst}
    >
      <MonoLabel variant="labelTrackedStrong" tone={now ? "accent" : "textSupporting"}>
        {`${lead.toUpperCase()}: `}
      </MonoLabel>
      <Span italic>{quoted ? `“${text}”` : text}</Span>
    </SerifBody>
  );
}

const styles = StyleSheet.create({
  issue: { gap: space[16] },
  artwork: { width: "100%", aspectRatio: 16 / 9, borderRadius: FEATURE_ARTWORK_RADIUS },
  words: { gap: space[8] },
  standfirst: { marginTop: space[4] },
  // Its foot, under a rule across it: its days and the way on, one line — Continue wraps under
  // them only where large text needs the room.
  onward: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[16],
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
  },
});
