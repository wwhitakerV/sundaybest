import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { TitleHeader } from "@/ui/TitleHeader";
import { useTheme } from "@/theme";
import { planOverviewHref } from "@/features/plans";
import { getUserPlans, useAppSelector } from "@/core/store";

export function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const plans = useAppSelector(getUserPlans);

  return (
    <Screen testID="progress-screen" padded>
      <TitleHeader
        title="Progress"
        actions={
          <HeaderIconButton
            testID="progress-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        }
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <FlatList
        data={plans}
        keyExtractor={(plan) => plan.id}
        renderItem={({ item: plan }) => (
          <Pressable
            testID={`progress-item-${plan.id}`}
            accessibilityRole="button"
            style={[styles.item, { borderBottomColor: theme.colors.divider }]}
            onPress={() => router.push(planOverviewHref(plan.id))}
          >
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
              {plan.title}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 16, borderBottomWidth: 1 },
});
