import { useId } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { getHeroPalette } from "@/entities/plan";
import { ProgressDial } from "@/ui/atoms/ProgressDial";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { radius, space, useTheme } from "@/theme";
import type { ApiLibraryPlanLook } from "../logic/api-plan-wording";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const TITLE_LINES = 2;
/** What VoiceOver calls the card's own action. */
const ACTION = "activate-action";
/** The progress ring at the end of the last line: room for its percent inside. */
const RING = 40;
/** How far the words rise over the foot of the artwork, so the two read as one. */
const PANEL_OVERLAP = space[40];
/** How far above the words the darkening starts, so it rises out of the artwork with no edge. */
const SCRIM_REACH = 56;
/** How much of the artwork, at its foot, melts into the card's colour under the words. */
const ART_FADE = 0.45;

export type LibraryPlanCardProps = {
  title: string;
  /** Its sermon's church, under the title; left out when it isn't known. */
  church: string | null;
  thumbnailUrl: string | null;
  /** The sermon's colours, strongest first — the card is set on the first. */
  colors: readonly string[];
  look: ApiLibraryPlanLook;
  /** How much of it is done, 0–100: the ring at the end of its last line, its percent inside. */
  percent: number;
  /** Finished — its ring closes. */
  done: boolean;
  /** Opens the plan. */
  onPress: () => void;
  /** Straight into its study — offered to VoiceOver on the card. */
  action?: { label: "Continue" | "Start"; onPress: () => void };
  testID: string;
  thumbnailTestID: string;
  progressTestID: string;
};

/**
 * One plan in the library, set as an offer is in a wallet: the card in its
 * sermon's own colour, the artwork across its top melting into it, and rising
 * out of the artwork's foot one continuous darkening, with its title, church,
 * and where it stands in white straight over it — no panel inside the card —
 * and a ring with its percent at the end. With no artwork it's the words alone
 * on the darkened colour. The whole card opens the plan.
 */
export function LibraryPlanCard({
  title,
  church,
  thumbnailUrl,
  colors,
  look,
  percent,
  done,
  onPress,
  action,
  testID,
  thumbnailTestID,
  progressTestID,
}: LibraryPlanCardProps) {
  const theme = useTheme();
  const { colour } = getHeroPalette(colors, theme.colors.featureBackdrop);
  const shownPercent = done ? 100 : Math.round(percent);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${look.summary}`}
      accessibilityHint="Opens the plan"
      {...(action && {
        accessibilityActions: [{ name: ACTION, label: action.label }],
        onAccessibilityAction: ({ nativeEvent }) => {
          if (nativeEvent.actionName === ACTION) action.onPress();
        },
      })}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colour }]}
    >
      {thumbnailUrl !== null && (
        <View>
          <VideoThumbnail testID={thumbnailTestID} uri={thumbnailUrl} style={styles.art} />
          <ArtFade colour={colour} />
        </View>
      )}

      <View
        testID={`${testID}-panel`}
        style={[
          styles.panel,
          {
            marginTop: thumbnailUrl !== null ? -PANEL_OVERLAP : 0,
            // The darkening's solid end, under the words: white always reads, whatever the colour.
            backgroundColor: theme.colors.mediaScrim,
          },
        ]}
      >
        <Scrim testID={`${testID}-scrim`} colour={theme.colors.mediaScrim} />
        <View testID={`${testID}-words`} style={styles.words}>
          <SFProTitle variant="offer" tone="inkOnDark" numberOfLines={TITLE_LINES}>
            {title}
          </SFProTitle>
          {church && (
            <SFProBody variant="detail" tone="inkOnDark" numberOfLines={1}>
              {church}
            </SFProBody>
          )}
          <View testID={`${testID}-status`} style={styles.status}>
            <SFProBody
              variant="detail"
              tone="inkOnDarkMuted"
              numberOfLines={1}
              style={styles.detail}
            >
              {look.detail}
            </SFProBody>
            <ProgressDial testID={progressTestID} percent={shownPercent} bare size={RING}>
              <MonoLabel variant="emphasis" tone="inkOnDark">{`${shownPercent}%`}</MonoLabel>
            </ProgressDial>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The darkening that rises out of the artwork into the words: one continuous
 * gradient, clear at its top, at its full strength where the words begin.
 */
function Scrim({ colour, testID }: { colour: string; testID: string }) {
  const id = `card-scrim-${useId()}`;
  return (
    <Svg testID={testID} style={styles.scrim} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colour} stopOpacity={0} />
          <Stop offset="1" stopColor={colour} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** The artwork's foot melting into the card's colour, under the words. */
function ArtFade({ colour }: { colour: string }) {
  // Unique per card: SVG gradient ids are document-global on some renderers.
  const id = `card-fade-${useId()}`;
  return (
    <Svg style={styles.fade} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colour} stopOpacity={0} />
          <Stop offset="1" stopColor={colour} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", borderRadius: radius[28], overflow: "hidden" },
  // Edge to edge across the card's top; the card's corners round it.
  art: { borderRadius: 0 },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: `${ART_FADE * 100}%`,
  },
  // The words, straight on the card: no panel of their own, the darkening running behind them.
  panel: {
    flexDirection: "row",
    paddingHorizontal: space[18],
    paddingTop: space[4],
    paddingBottom: space[18],
  },
  scrim: { position: "absolute", left: 0, right: 0, top: -SCRIM_REACH, height: SCRIM_REACH },
  words: { flex: 1, gap: space[4] },
  // Its last line: where it stands, and the ring at the end — the panel's bottom-right corner.
  status: { flexDirection: "row", alignItems: "center", gap: space[12], marginTop: space[4] },
  detail: { flex: 1 },
});
