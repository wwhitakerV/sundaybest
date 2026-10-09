import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space } from "@/theme";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { DayPanel } from "../components/DayPanel";
import { ProgressRows } from "../components/ProgressRows";
import { WeekHeader } from "../components/WeekHeader";
import { WeekSkeleton } from "../components/WeekSkeleton";
import { WeekStrip } from "../components/WeekStrip";
import { useWeekView } from "../hooks/use-week-view";

/**
 * Progress: a week of study. Its head — where its study came from, its title,
 * and its dates — then its seven days, one picked; the picked day's passage,
 * by where it stands (its verse and what was written, ready, still here, or
 * opening); and under them, what the reader has gathered in all. The dates
 * open a picker of every week a plan ran in. It fits the
 * screen and never scrolls: the panel takes the room the rest leaves, and the
 * rows end 24pt above the tab bar. Swiped, the days go to the week before or
 * after with a plan in it.
 */
/** Between the rows and the floating tab bar, as on every Settings page. */
const TAB_BAR_GAP = space[24];

export function ProgressScreen() {
  const view = useWeekView();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  if (view.error) {
    return (
      <ScreenLoadError
        testID="progress-load-error"
        title="Couldn't load Progress"
        onRetry={view.retry}
      />
    );
  }

  return (
    <ScrollScreen
      testID="progress-screen"
      fixed
      contentStyle={{ paddingBottom: getFootAboveTabBar(insetBottom, TAB_BAR_GAP) }}
    >
      <SkeletonHandoff
        testID="progress-handoff"
        fill
        pending={view.loading}
        skeleton={<WeekSkeleton testID="progress-content-pending" />}
      >
        <View style={styles.page}>
          {view.header && (
            <WeekHeader
              source={view.header.source}
              title={view.header.title}
              range={view.header.range}
              picker={view.picker}
              onPickWeek={view.pickWeek}
              preview={view.pickerPreview}
            />
          )}
          <WeekStrip
            tiles={view.tiles}
            selected={view.selectedDate}
            onSelect={view.selectDay}
            canGoBack={view.canGoBack}
            canGoForward={view.canGoForward}
            onPrevious={view.previousWeek}
            onNext={view.nextWeek}
          />
          <DayPanel
            date={view.selectedDate}
            label={view.dayLabel}
            isToday={view.isToday}
            translation={view.translation}
            pages={view.pages}
            index={view.passageIndex}
            onShow={view.showPassage}
            onOpen={view.open}
          />
          {view.rows && <ProgressRows {...view.rows} />}
        </View>
      </SkeletonHandoff>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  // The whole height between the ends: the day panel takes what the rest leaves.
  page: { flex: 1, gap: space[24] },
});
