import { StyleSheet, View } from "react-native";
import { Plus, Share, X } from "lucide-react-native";

import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ContentPending } from "@/ui/molecules/ContentPending";
import { StatCard } from "@/ui/molecules/StatCard";
import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { PlanCompleteFlame } from "../components/PlanCompleteFlame";
import { StudyNotFound } from "../components/StudyNotFound";
import { usePlanComplete } from "../hooks/use-plan-complete";

export function PlanCompleteScreen() {
  const view = usePlanComplete();

  if (!view.found && view.loading) {
    return (
      <MilestoneScreen
        testID="plan-complete-screen"
        header={
          <HeaderIconButton
            testID="plan-complete-close-button"
            icon={X}
            accessibilityLabel="Close"
            onPress={view.close}
          />
        }
        mark={<PlanCompleteFlame testID="plan-complete-flame" />}
        title="Plan complete"
      >
        <ContentPending testID="plan-complete-content-pending" compact />
      </MilestoneScreen>
    );
  }

  if (!view.found) {
    return (
      <StudyNotFound
        testID="plan-complete-not-found"
        error={Boolean(view.error)}
        onRetry={view.retry}
      />
    );
  }

  const { summary } = view;

  return (
    <MilestoneScreen
      testID="plan-complete-screen"
      header={
        <HeaderIconButton
          testID="plan-complete-close-button"
          icon={X}
          accessibilityLabel="Close"
          onPress={view.close}
        />
      }
      mark={<PlanCompleteFlame testID="plan-complete-flame" />}
      title="Plan complete"
    >
      <View style={styles.stats}>
        <StatCard
          testID="plan-complete-days"
          value={`${summary.completedDays}/${summary.totalDays}`}
          label="Days"
        />

        <StatCard testID="plan-complete-notes" value={String(summary.notes)} label="Notes" />

        <StatCard
          testID="plan-complete-quiz"
          value={`${summary.quizCorrect}/${summary.quizTotal}`}
          label="Quiz"
        />
      </View>

      <Card style={styles.next}>
        <MonoLabel tone="textMuted">Sunday&apos;s coming</MonoLabel>

        <SFProTitle variant="preview">
          Add next week&apos;s sermon and keep your streak going.
        </SFProTitle>

        <View style={styles.actions}>
          <CompactButton
            testID="plan-complete-add-sermon-button"
            label="Add sermon"
            icon={Plus}
            tone="dark"
            onPress={view.addSermon}
          />

          <CompactButton
            testID="plan-complete-share-button"
            label="Share"
            icon={Share}
            tone="soft"
            onPress={() => undefined}
          />
        </View>
      </Card>
    </MilestoneScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    gap: space[12],
  },

  next: {
    padding: space[24],
    gap: space[16],
  },

  actions: {
    flexDirection: "row",
    gap: space[12],
  },
});
