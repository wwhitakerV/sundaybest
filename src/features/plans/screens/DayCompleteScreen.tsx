import { View } from "react-native";
import { Flame } from "lucide-react-native";

import { WeekStrip } from "@/features/progress";
import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { IconRing } from "@/ui/atoms/IconRing";
import { ContentPending } from "@/ui/molecules/ContentPending";
import { MilestoneScreen } from "@/ui/organisms/MilestoneScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { DayGained } from "../components/DayGained";
import { NextDayCard } from "../components/NextDayCard";
import { QuickCheckResults } from "../components/QuickCheckResults";
import { StudyNotFound } from "../components/StudyNotFound";
import { useDayComplete } from "../hooks/use-day-complete";

const stay = () => undefined;

/**
 * A day's one finish page, a single scroll: the day done and its sermon;
 * this week's strip, the day filled; what it gave — its key verse and what
 * was written; its Quick Check, when it had one — what was remembered and
 * every answer, missed first; and what's next. Done goes back to the plan.
 */
export function DayCompleteScreen() {
  const view = useDayComplete();

  if (!view.found && view.loading) {
    return (
      <MilestoneScreen
        testID="day-complete-screen"
        mark={<IconRing testID="day-complete-ring" icon={Flame} done />}
        title={view.dayNumber > 0 ? `Day ${view.dayNumber} done` : "Day complete"}
      >
        <ContentPending testID="day-complete-content-pending" compact />
      </MilestoneScreen>
    );
  }

  if (!view.found) {
    return (
      <StudyNotFound testID="day-complete-not-found" error={view.error} onRetry={view.retry} />
    );
  }

  return (
    <MilestoneScreen
      testID="day-complete-screen"
      mark={<IconRing testID="day-complete-ring" icon={Flame} done />}
      title={`Day ${view.dayNumber} done`}
      subtitle={view.planTitle}
      footer={<Button testID="day-complete-done-button" label="Done" onPress={view.done} />}
    >
      <View testID="day-complete-week">
        <WeekStrip
          tiles={view.tiles}
          selected={view.today}
          onSelect={stay}
          canGoBack={false}
          canGoForward={false}
          onPrevious={stay}
          onNext={stay}
        />
      </View>

      <DayGained
        testID="day-complete-gained"
        reference={view.passage.reference}
        translation={view.passage.translation}
        verse={view.passage.verse}
        wrote={view.wrote}
      />

      {view.quickCheck && (
        <View testID="day-complete-quick-check" style={{ gap: space[16] }}>
          <SFProBody variant="reading">{view.quickCheck.remembered}</SFProBody>
          <QuickCheckResults testID="day-complete-results" items={view.quickCheck.review} />
        </View>
      )}

      {view.upNext && (
        <NextDayCard
          testID="day-complete-up-next"
          title={view.upNext.title}
          when={view.upNext.when}
        />
      )}
    </MilestoneScreen>
  );
}
