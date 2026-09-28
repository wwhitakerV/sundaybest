import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Trophy } from "lucide-react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { useTheme } from "@/theme";
import FRIENDS_ART from "../../../../assets/images/fun/09_challenge_friends_people_graphic.png";

const TROPHY_BADGE = 48;
const TROPHY_SIZE = 24;
/** The friends' faces, overlapping: 136 × 56 at 2x. */
const FRIENDS_WIDTH = 68;
const FRIENDS_ASPECT = 136 / 56;

export type ChallengeFriendsCardProps = {
  onPress: () => void;
  testID: string;
};

/**
 * The invitation to play with friends, the page's full width in blush: a
 * trophy, the pitch, and the faces of friends to take on, with a chevron to
 * go on in.
 */
export function ChallengeFriendsCard({ onPress, testID }: ChallengeFriendsCardProps) {
  const theme = useTheme();
  const gap = theme.spacing.md;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Challenge friends. Make it a friendly competition. Invite friends, track wins, and climb the leaderboard."
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.illustrationBlush,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.lg,
          gap,
        },
      ]}
    >
      <View style={[styles.row, { gap }]}>
        <View
          style={[
            styles.trophy,
            { backgroundColor: theme.colors.overlayButtonLight, borderRadius: theme.radii.pill },
          ]}
        >
          <Trophy
            size={TROPHY_SIZE}
            color={theme.colors.trophy}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <View style={[styles.words, { gap: theme.spacing.xs }]}>
          <Text style={[theme.typography.tileTitle, { color: theme.colors.inkOnLight }]}>
            Make it a friendly competition.
          </Text>
          <Text style={[theme.typography.cardDetail, { color: theme.colors.inkOnLightMuted }]}>
            Invite friends, track wins, and climb the leaderboard.
          </Text>
        </View>
      </View>

      <View style={[styles.foot, { paddingLeft: TROPHY_BADGE + gap }]}>
        <Image source={FRIENDS_ART} style={styles.friends} />
        <ChevronBadge />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "flex-start" },
  trophy: {
    width: TROPHY_BADGE,
    height: TROPHY_BADGE,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  friends: { width: FRIENDS_WIDTH, aspectRatio: FRIENDS_ASPECT },
});
