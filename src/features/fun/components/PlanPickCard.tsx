import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import {
  BookOpen,
  HandHeart,
  ListChecks,
  MessageCircleQuestionMark,
  ScrollText,
  type LucideIcon,
} from "lucide-react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { Tag } from "@/ui/Tag";
import { useTheme, type Theme } from "@/theme";
import type { PlanPickActivity } from "../logic/plan-picks";

/** Wide enough for two tags beside the chevron, narrow enough that the next card peeks in. */
export const PLAN_PICK_CARD_WIDTH = 300;
const ARTWORK_WIDTH = 84;

type ActivityLook = {
  label: string;
  icon: LucideIcon;
  colour: (theme: Theme) => string;
  tint: (theme: Theme) => string;
};

/** Each activity's name, and its icon and colours. */
const ACTIVITY_LOOKS = new Map<PlanPickActivity, ActivityLook>([
  [
    "read",
    {
      label: "Read",
      icon: BookOpen,
      colour: (t) => t.colors.stepRead,
      tint: (t) => t.colors.stepReadTint,
    },
  ],
  [
    "scripture",
    {
      label: "Scripture",
      icon: ScrollText,
      colour: (t) => t.colors.stepScripture,
      tint: (t) => t.colors.stepScriptureTint,
    },
  ],
  [
    "reflect",
    {
      label: "Reflect",
      icon: MessageCircleQuestionMark,
      colour: (t) => t.colors.stepReflect,
      tint: (t) => t.colors.stepReflectTint,
    },
  ],
  [
    "pray",
    {
      label: "Pray",
      icon: HandHeart,
      colour: (t) => t.colors.stepPray,
      tint: (t) => t.colors.stepPrayTint,
    },
  ],
  [
    "quiz",
    {
      label: "Quiz",
      icon: ListChecks,
      colour: (t) => t.colors.stepQuickCheck,
      tint: (t) => t.colors.stepQuickCheckTint,
    },
  ],
]);

export type PlanPickCardProps = {
  title: string;
  reference: string | null;
  detail: string;
  artwork: ImageSourcePropType;
  activities: readonly PlanPickActivity[];
  onPress: () => void;
  testID: string;
};

/**
 * A day from one of the user's plans, to go back to: its artwork, its title
 * and Scripture, the opening of its reading, and what it offers — tagged in
 * Plan Detail's own step colours. Quieter than the games: plain surface, no
 * illustration of its own.
 */
export function PlanPickCard({
  title,
  reference,
  detail,
  artwork,
  activities,
  onPress,
  testID,
}: PlanPickCardProps) {
  const theme = useTheme();
  const looks = activities.flatMap((activity) => {
    const look = ACTIVITY_LOOKS.get(activity);
    return look ? [{ key: activity, ...look }] : [];
  });

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, reference, looks.map((look) => look.label).join(", ")]
        .filter(Boolean)
        .join(". ")}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.sm,
          gap: theme.spacing.md,
        },
      ]}
    >
      <Image
        source={artwork}
        resizeMode="cover"
        style={[styles.artwork, { borderRadius: theme.radii.md }]}
      />

      <View style={[styles.words, { paddingVertical: theme.spacing.xs }]}>
        <View>
          <Text
            numberOfLines={1}
            style={[theme.typography.tileTitle, { color: theme.colors.text }]}
          >
            {title}
          </Text>
          {reference && (
            <Text
              numberOfLines={1}
              style={[theme.typography.metaLabel, { color: theme.colors.textMuted }]}
            >
              {reference}
            </Text>
          )}
          <Text
            numberOfLines={2}
            style={[
              theme.typography.cardDetail,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            {detail}
          </Text>
        </View>

        <View style={[styles.foot, { gap: theme.spacing.xs, paddingTop: theme.spacing.sm }]}>
          {looks.map((look) => (
            <Tag
              key={look.key}
              testID={`${testID}-tag-${look.key}`}
              icon={look.icon}
              label={look.label}
              color={look.colour(theme)}
              background={look.tint(theme)}
            />
          ))}
          <View style={styles.chevron}>
            <ChevronBadge />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: PLAN_PICK_CARD_WIDTH, flexDirection: "row" },
  artwork: { width: ARTWORK_WIDTH, alignSelf: "stretch" },
  words: { flex: 1, justifyContent: "space-between" },
  foot: { flexDirection: "row", alignItems: "center" },
  chevron: { marginLeft: "auto" },
});
