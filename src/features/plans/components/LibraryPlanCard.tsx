import { StyleSheet, View } from "react-native";
import { Flame } from "lucide-react-native";

import { Card } from "@/ui/atoms/Card";
import { ProgressDial } from "@/ui/atoms/ProgressDial";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { radius, space, useTheme } from "@/theme";
import type { LibraryPlanLook } from "../logic/library";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { PlanCardAction } from "./PlanCardAction";

const TITLE_LINES = 2;
/** The flame inside the dial: sized to its ring, its line a touch firm. */
const FLAME = { size: 17, strokeWidth: 3 } as const;
/** What VoiceOver calls the card's own action. */
const ACTION = "activate-action";

export type LibraryPlanCardProps = {
  title: string;
  /** Its sermon's church, under the title; left out when it isn't known. */
  church: string | null;
  thumbnailUrl: string | null;
  look: LibraryPlanLook;
  /** How much of it is done, 0–100: the dial in its bottom row. */
  percent: number;
  /** Finished — its dial's flame turns red. */
  done: boolean;
  /** Opens the plan. */
  onPress: () => void;
  /** Straight into its study: Continue for a plan under way, Start for one not started. */
  action?: { label: "Continue" | "Start"; onPress: () => void };
  testID: string;
  /** Its thumbnail's. */
  thumbnailTestID: string;
  /** Its progress dial's; the flame in it is this, then `-flame`. */
  progressTestID: string;
  /** Its action's, when it has one. */
  actionTestID: string;
};

/**
 * One plan in the library, on a soft card of its own: its sermon's thumbnail
 * at 16:9, inset; its title and church; and, well under them, a dial of how
 * much is done — a flame in it, grey until the plan's finished, then red —
 * beside the day it's on, with Continue or Start at the end of that row. The
 * whole card opens the plan.
 */
export function LibraryPlanCard({
  title,
  church,
  thumbnailUrl,
  look,
  percent,
  done,
  onPress,
  action,
  testID,
  thumbnailTestID,
  progressTestID,
  actionTestID,
}: LibraryPlanCardProps) {
  const theme = useTheme();

  return (
    <Card
      testID={testID}
      radius={32}
      edge={false}
      accessibilityLabel={`${title}. ${look.summary}`}
      accessibilityHint="Opens the plan"
      // The card is one element to VoiceOver, so its action is offered on it.
      {...(action && {
        accessibilityActions: [{ name: ACTION, label: action.label }],
        onAccessibilityAction: ({ nativeEvent }) => {
          if (nativeEvent.actionName === ACTION) action.onPress();
        },
      })}
      onPress={onPress}
      style={[styles.card, { padding: space[12], gap: space[16] }]}
    >
      <VideoThumbnail
        testID={thumbnailTestID}
        uri={thumbnailUrl}
        style={{ borderRadius: radius[20] }}
      />

      <View style={{ gap: space[20], paddingHorizontal: space[8], paddingBottom: space[8] }}>
        <View style={{ gap: space[4] }}>
          <SFProTitle variant="card" numberOfLines={TITLE_LINES}>
            {title}
          </SFProTitle>
          {church && (
            <SFProBody tone="textMuted" numberOfLines={1}>
              {church}
            </SFProBody>
          )}
        </View>
        <View style={[styles.row, { gap: space[12] }]}>
          <ProgressDial testID={progressTestID} percent={percent}>
            <View testID={`${progressTestID}-flame`}>
              <Flame
                size={FLAME.size}
                strokeWidth={FLAME.strokeWidth}
                color={done ? theme.colors.accent : theme.colors.textMuted}
              />
            </View>
          </ProgressDial>
          <MonoLabel tone="textInactive" numberOfLines={1} style={styles.detail}>
            {look.detail}
          </MonoLabel>
          {action && (
            <PlanCardAction
              testID={actionTestID}
              label={action.label}
              title={title}
              onPress={action.onPress}
            />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
  row: { flexDirection: "row", alignItems: "center" },
  detail: { flex: 1 },
});
