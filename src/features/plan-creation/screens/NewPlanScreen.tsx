import { ScrollView, StyleSheet, View } from "react-native";
import { useIsFocused } from "expo-router";
import Animated from "react-native-reanimated";

import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { useStepTransition } from "@/hooks/use-step-transition";
import { CaptionsSheet } from "../components/CaptionsSheet";
import { useNewPlanFlow } from "../hooks/use-new-plan-flow";
import { DayCountPicker } from "../components/DayCountPicker";
import { HowToCopyCard } from "../components/HowToCopyCard";
import { PlanCreationHeader } from "../components/PlanCreationHeader";
import { QuickCheckToggle } from "../components/QuickCheckToggle";
import { SermonLinkField } from "../components/SermonLinkField";
import { SermonPreview } from "../components/SermonPreview";
import { formatDuration } from "@/utils/time/formatDuration";
import { NEW_PLAN_STEPS } from "../logic/new-plan-steps";
import { shortenLink } from "../logic/sermon-link";
import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/**
 * New Plan: paste a sermon link, then see its sermon, pick how many days, and
 * choose whether to add a Quick Check. One screen with internal step state —
 * the same pattern as Daily Study and Quick Check: the header and action stay
 * put, only the body cross-fades (`useStepTransition`). If the video turns
 * out to have no captions, a sheet says so.
 *
 * The first screen of the New Plan full-screen modal (`src/app/(plan-creation)`).
 * The flow and what each control does: `useNewPlanFlow`.
 */
export function NewPlanScreen() {
  const flow = useNewPlanFlow();
  const focused = useIsFocused();
  const { renderedStep, bodyStyle } = useStepTransition(flow.stepIndex);
  const { state, shownChecked } = flow;
  const current = NEW_PLAN_STEPS.at(flow.stepIndex) ?? NEW_PLAN_STEPS[0];
  const body = NEW_PLAN_STEPS.at(renderedStep) ?? NEW_PLAN_STEPS[0];

  return (
    <Screen testID="new-plan-screen" padded>
      <PlanCreationHeader
        testID={current.key}
        leading={current.leading}
        step={current.counter}
        onPress={flow.leading}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View testID={`${body.key}-body`} style={[styles.body, bodyStyle]}>
          {renderedStep === 0 ? (
            <>
              <SFProTitle>Paste a sermon link</SFProTitle>
              <SFProBody tone="textMuted">Any public sermon video with captions works.</SFProBody>
              <SermonLinkField
                testID="paste-sermon-link-input"
                value={state.link}
                onChangeText={flow.changeLink}
                onPaste={() => void flow.paste()}
                error={state.step === "paste" ? state.linkError : null}
              />
              <HowToCopyCard />
            </>
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
      </ScrollView>

      <View style={styles.action}>
        <Button
          testID={current.actionTestID}
          label={current.actionLabel}
          disabled={state.step === "paste" && state.link.trim() === ""}
          onPress={flow.next}
        />
      </View>

      {/* Only once Preparing has handed back — never over it. */}
      <CaptionsSheet
        testID="captions-sheet"
        visible={flow.noCaptions && focused}
        onTryAnotherLink={flow.tryAnotherLink}
        onRemindLater={flow.remindLater}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: space[16] },
  body: { gap: space[16] },
  action: { paddingBottom: space[8] },
});
