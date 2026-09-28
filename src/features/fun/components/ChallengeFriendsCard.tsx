import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { ImageCrop } from "@/ui/ImageCrop";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import FRIENDS_ART from "../../../../assets/images/fun/challenge-friends-trophy-avatars.png";
import { getFunDestinationTitle } from "../logic/destinations";

/** The illustration's own size: a trophy on the left, three friends over mountains on the right. */
const ART_SIZE = { width: 1320, height: 495 };
/** The trophy and its sparks, alone. */
const TROPHY_CROP = { x: 255, y: 50, width: 310, height: 380 };
/** The three friends, and the mountains running off to their right. */
const FRIENDS_CROP = { x: 555, y: 105, width: 740, height: 335 };
const TROPHY_WIDTH = 40;
/** The friends' share of the banner's width, against its right edge. They scale with it. */
const FRIENDS_WIDTH = "38%";
/** How much of the friends' left edge dissolves into the banner, beside the words. */
const FRIENDS_FADE = 0.2;
/** Room the words leave beyond the chevron, so they stay clear of the friends. */
const WORDS_CLEARANCE = "16%";

export type ChallengeFriendsCardProps = {
  onPress: () => void;
  testID: string;
};

/**
 * The invitation to play with friends, the page's full width on a blush to
 * lavender wash: a trophy, the pitch, and friends to take on, with a chevron
 * to go on in. The friends scale with the banner and fade at their left edge,
 * so on a narrow phone the art gives way rather than the words.
 */
export function ChallengeFriendsCard({ onPress, testID }: ChallengeFriendsCardProps) {
  const theme = useTheme();
  const blush = theme.colors.illustrationBlush;
  const destination = getFunDestinationTitle("challenge-friends");

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${destination}. Make it a friendly competition. Invite friends, track wins, and climb the leaderboard.`}
      accessibilityHint={`Opens ${destination}`}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: blush,
          borderRadius: theme.radii.card,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        },
      ]}
    >
      <GradientBackdrop stops={getBackdropStops([theme.colors.illustrationLilac, blush], blush)} />
      <View pointerEvents="none" style={styles.friendsSlot}>
        <ImageCrop
          testID={`${testID}-avatars`}
          source={FRIENDS_ART}
          size={ART_SIZE}
          crop={FRIENDS_CROP}
          fadeLeft={FRIENDS_FADE}
          style={styles.fill}
        />
      </View>

      <ImageCrop
        testID={`${testID}-trophy`}
        source={FRIENDS_ART}
        size={ART_SIZE}
        crop={TROPHY_CROP}
        style={styles.trophy}
      />
      <View style={[styles.words, { gap: theme.spacing.xs }]}>
        <Text style={[theme.typography.tileTitle, { color: theme.colors.inkOnLight }]}>
          Make it a friendly competition.
        </Text>
        <Text style={[theme.typography.cardDetail, { color: theme.colors.inkOnLightMuted }]}>
          Invite friends, track wins, and climb the leaderboard.
        </Text>
      </View>
      <ChevronBadge />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", overflow: "hidden" },
  // Holds the friends against the banner's right edge, centred top to bottom.
  friendsSlot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: FRIENDS_WIDTH,
    justifyContent: "center",
  },
  fill: { width: "100%" },
  trophy: { width: TROPHY_WIDTH },
  words: { flex: 1, marginRight: WORDS_CLEARANCE },
});
