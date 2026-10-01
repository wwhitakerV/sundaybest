import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock3 } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { Screen } from "@/ui/organisms/Screen";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { useTheme } from "@/theme";
import { getFunDestinationTitle, parseFunDestination } from "../logic/destinations";

const MARK_SIZE = 64;
const MARK_ICON_SIZE = 28;

/**
 * Where a Fun game, every game, or the invitation to friends opens while it's
 * still being built: its name, and that it's coming soon. A destination Fun
 * doesn't know says so plainly instead. Back returns to Fun.
 */
export function ComingSoonScreen() {
  const theme = useTheme();
  const router = useRouter();
  const destination = parseFunDestination(useLocalSearchParams().destination);

  return (
    <Screen testID="fun-coming-soon-screen" padded>
      <ScreenHeader
        title=""
        left={
          <HeaderIconButton
            testID="fun-coming-soon-back-button"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
        }
      />

      <View style={[styles.body, { gap: theme.spacing.sm }]}>
        <View
          style={[
            styles.mark,
            {
              backgroundColor: theme.colors.segmentBackground,
              borderRadius: theme.radii.pill,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          <Clock3
            size={MARK_ICON_SIZE}
            color={theme.colors.textMuted}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={[theme.typography.headline, styles.centred, { color: theme.colors.text }]}
        >
          {destination ? getFunDestinationTitle(destination) : "This isn't here"}
        </Text>
        <Text style={[theme.typography.body, styles.centred, { color: theme.colors.textMuted }]}>
          {destination ? "Coming soon" : "Head back to Fun to find something to play."}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  mark: { width: MARK_SIZE, height: MARK_SIZE, alignItems: "center", justifyContent: "center" },
  centred: { textAlign: "center" },
});
