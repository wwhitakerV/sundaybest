import { Pressable, StyleSheet } from "react-native";
import { Link2, Search, Sparkles, type LucideIcon } from "lucide-react-native";
import { useIsFocused } from "expo-router";
import Animated from "react-native-reanimated";

import { FeedbackPanel } from "@/ui/organisms/FeedbackPanel";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { ScreenFooter } from "@/ui/organisms/ScreenFooter";
import { Button } from "@/ui/atoms/Button";
import { useStepTransition } from "@/hooks/use-step-transition";
import { CaptionsSheet } from "../components/CaptionsSheet";
import { useNewPlanFlow } from "../hooks/use-new-plan-flow";
import { DayCountPicker } from "../components/DayCountPicker";
import { FIELD_ICON_CENTRE } from "../components/field-geometry";
import { HowToCopyCard } from "../components/HowToCopyCard";
import { PlanCreationHeader } from "../components/PlanCreationHeader";
import { QuickCheckToggle } from "../components/QuickCheckToggle";
import { SermonLinkField } from "../components/SermonLinkField";
import { SermonPreview } from "../components/SermonPreview";
import { SermonSearchField } from "../components/SermonSearchField";
import { SermonSearchResults } from "../components/SermonSearchResults";
import { formatDuration } from "@/utils/time/formatDuration";
import { NEW_PLAN_STEPS } from "../logic/new-plan-steps";
import { shortenLink } from "../logic/sermon-link";
import { space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/**
 * New Plan: choose a sermon by pasting its link or searching the temporary
 * frontend catalogue, then explicitly Continue into the shared preview/build
 * path. Selecting a search row alone never advances or starts generation.
 */
export function NewPlanScreen() {
  const flow = useNewPlanFlow();
  const theme = useTheme();
  const focused = useIsFocused();
  const { renderedStep, bodyStyle } = useStepTransition(flow.stepIndex);
  const { state, shownChecked } = flow;
  const current = NEW_PLAN_STEPS.at(flow.stepIndex) ?? NEW_PLAN_STEPS[0];
  const body = NEW_PLAN_STEPS.at(renderedStep) ?? NEW_PLAN_STEPS[0];
  const searching = state.inputMode === "search";
  const action = (
    <Button
      testID={current.actionTestID}
      label={current.actionLabel}
      // A little magic on the step that makes the plan.
      {...(current.key === "link-preview" && { icon: Sparkles })}
      disabled={!flow.canContinue}
      onPress={flow.next}
    />
  );

  return (
    <ScrollScreen
      testID="new-plan-screen"
      header={
        <PlanCreationHeader
          testID={current.key}
          leading={current.leading}
          step={current.counter}
          onPress={flow.leading}
        />
      }
      footer={
        // The link's verdict at the foot, as a quiz answer's is: why it won't work, or a cheer.
        flow.linkFeedback ? (
          <FeedbackPanel
            testID="new-plan-link-feedback"
            tone={flow.linkFeedback.tone}
            title={flow.linkFeedback.title}
            detail={flow.linkFeedback.detail}
          >
            {action}
          </FeedbackPanel>
        ) : (
          <ScreenFooter testID="new-plan-footer">{action}</ScreenFooter>
        )
      }
      overlay={
        // Only once Preparing has handed back — never over it.
        <CaptionsSheet
          testID="captions-sheet"
          visible={flow.noCaptions && focused}
          onTryAnotherLink={flow.tryAnotherLink}
          onRemindLater={flow.remindLater}
        />
      }
      contentStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View testID={`${body.key}-body`} style={[styles.body, bodyStyle]}>
        {renderedStep === 0 ? (
          searching ? (
            <>
              <SFProTitle>Find a sermon</SFProTitle>
              <SFProBody tone="textMuted">
                Search by pastor, church, topic, or sermon title.
              </SFProBody>
              <SermonSearchField
                testID="search-sermons-input"
                value={state.searchQuery}
                onChangeText={flow.changeSearchQuery}
                onSubmit={flow.submitSearch}
                onClear={flow.clearSearch}
              />
              <InputModeAction
                testID="new-plan-paste-instead"
                icon={Link2}
                label="Paste a sermon link instead"
                onPress={flow.showPaste}
                color={theme.colors.textInactive}
                strokeWidth={theme.icon.strokeWidth}
              />
              <SermonSearchResults
                testID="sermon-search-results"
                query={state.searchQuery}
                results={flow.searchResults}
                status={flow.searchStatus}
                selectedId={state.searchSelection?.id ?? null}
                onSelect={flow.selectSearchResult}
              />
            </>
          ) : (
            <>
              <SFProTitle>Paste a sermon link</SFProTitle>
              <SFProBody tone="textMuted">Any public sermon video with captions works.</SFProBody>
              <SermonLinkField
                testID="paste-sermon-link-input"
                value={state.link}
                onChangeText={flow.changeLink}
                onPaste={() => void flow.paste()}
                invalid={flow.linkFeedback?.tone === "incorrect"}
              />
              <InputModeAction
                testID="new-plan-search-instead"
                icon={Search}
                label="Search for a sermon instead"
                onPress={flow.showSearch}
                color={theme.colors.textInactive}
                strokeWidth={theme.icon.strokeWidth}
              />
              <HowToCopyCard />
            </>
          )
        ) : (
          shownChecked && (
            <>
              <SermonPreview
                testID="link-preview-sermon"
                link={shortenLink(shownChecked.url)}
                title={shownChecked.sermon.title}
                church={shownChecked.sermon.church}
                thumbnailUrl={shownChecked.sermon.thumbnailUrl}
                duration={formatDuration(shownChecked.sermon.durationSeconds)}
              />
              <DayCountPicker
                testID="link-preview-days"
                value={state.days}
                onChange={flow.pickDays}
              />
              <QuickCheckToggle
                testID="link-preview-quick-check-toggle"
                value={state.quickCheck}
                onChange={flow.setQuickCheck}
              />
            </>
          )
        )}
      </Animated.View>
    </ScrollScreen>
  );
}

/** The switch's icon: a size under the field's, so it reads as the quieter choice. */
const MODE_ICON = 18;

type InputModeActionProps = {
  testID: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  color: string;
  strokeWidth: number;
};

/** Quietly switches the first step's input method without competing with Continue. */
function InputModeAction({
  testID,
  icon: Icon,
  label,
  onPress,
  color,
  strokeWidth,
}: InputModeActionProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.modeAction, { opacity: pressed ? 0.55 : 1 }]}
    >
      <Icon size={MODE_ICON} color={color} strokeWidth={strokeWidth} />
      <SFProBody variant="detail" tone="textInactive">
        {label}
      </SFProBody>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space[16] },
  body: { gap: space[16] },
  modeAction: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
    // Its icon centred under the field's.
    paddingLeft: FIELD_ICON_CENTRE - MODE_ICON / 2,
    paddingRight: space[6],
    paddingVertical: space[4],
    // Room under it, before what the step shows next.
    marginBottom: space[16],
  },
});
