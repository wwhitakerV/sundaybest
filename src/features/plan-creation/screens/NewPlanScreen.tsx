import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import Animated from "react-native-reanimated";

import type { PlanLength } from "@/types/domain";
import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { useModalSession } from "@/hooks/use-modal-session";
import { useStepTransition } from "@/hooks/use-step-transition";
import { lookUpMockSermon, type SermonPreview as Preview } from "@/core/plan-builder";
import { getPlanGeneration, getUserSettings, useAppSelector, useStoreActions } from "@/core/store";
import { CaptionsSheet } from "../components/CaptionsSheet";
import { DayCountPicker } from "../components/DayCountPicker";
import { HowToCopyCard } from "../components/HowToCopyCard";
import { PlanCreationHeader } from "../components/PlanCreationHeader";
import { QuickCheckToggle } from "../components/QuickCheckToggle";
import { SermonLinkField } from "../components/SermonLinkField";
import { SermonPreview } from "../components/SermonPreview";
import { formatDuration } from "../logic/format-duration";
import {
  NEW_PLAN_STEPS,
  getNewPlanLeadingAction,
  getNextNewPlanAction,
} from "../logic/new-plan-steps";
import { checkSermonLink, shortenLink } from "../logic/sermon-link";

/** The link checked on the first step, and the sermon it points to. */
type CheckedLink = { url: string; sermon: Preview };

/**
 * New Plan: paste a sermon link, then see its sermon, pick how many days, and
 * choose whether to add a Quick Check. One screen with internal step state —
 * the same pattern as Daily Study and Quick Check: the header and action stay
 * put, only the body cross-fades (`useStepTransition`).
 *
 * "Create my plan" makes a draft plan in the store, starts building it, and
 * hands off to Preparing. If the video turns out to have no captions,
 * Preparing brings the user back here, where a sheet says so.
 *
 * The first screen of the New Plan full-screen modal (`src/app/(plan-creation)`).
 * X on the first step dismisses the whole modal; Back on the second steps back.
 */
export function NewPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useModalSession();
  const focused = useIsFocused();
  const settings = useAppSelector(getUserSettings);
  const generation = useAppSelector(getPlanGeneration);
  const { createPlan, startPlanGeneration, archivePlan } = useStoreActions();

  const [step, setStep] = useState(0);
  const { renderedStep, bodyStyle } = useStepTransition(step);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [checked, setChecked] = useState<CheckedLink | null>(null);
  const [days, setDays] = useState<PlanLength>(settings.defaultPlanLength);
  const [quickCheck, setQuickCheck] = useState(settings.quickCheckByDefault);
  const [planId, setPlanId] = useState<string | null>(null);

  const current = NEW_PLAN_STEPS.at(step) ?? NEW_PLAN_STEPS[0];
  const body = NEW_PLAN_STEPS.at(renderedStep) ?? NEW_PLAN_STEPS[0];
  const noCaptions =
    planId !== null &&
    generation?.planId === planId &&
    generation.status === "failed" &&
    generation.error?.code === "noCaptions";

  function onChangeLink(text: string) {
    setLink(text);
    setLinkError(null);
  }

  function onLeading() {
    const action = getNewPlanLeadingAction(step);
    if (action.type === "exit") session.exit();
    else setStep(action.step);
  }

  function createAndBuild(url: string, sermon: Preview) {
    const id = createPlan({
      sourceUrl: url,
      title: sermon.title,
      lengthDays: days,
      quickCheckEnabled: quickCheck,
    });
    startPlanGeneration(id);
    setPlanId(id);
    router.push({ pathname: "/(plan-creation)/preparing", params: { planId: id } });
  }

  function onNext() {
    const action = getNextNewPlanAction(step);
    if (action.type === "create") {
      if (checked) createAndBuild(checked.url, checked.sermon);
      return;
    }
    const result = checkSermonLink(link);
    if (!result.valid) {
      setLinkError(result.message);
      return;
    }
    setChecked({ url: result.url, sermon: lookUpMockSermon(result.url) });
    setStep(action.step);
  }

  /** Back to an empty link, putting away the plan that couldn't be built. */
  function onTryAnotherLink() {
    if (planId) archivePlan(planId);
    setPlanId(null);
    setChecked(null);
    setLink("");
    setStep(0);
  }

  return (
    <Screen testID="new-plan-screen" padded>
      <PlanCreationHeader
        testID={current.key}
        leading={current.leading}
        step={current.counter}
        onPress={onLeading}
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
              <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
                Paste a sermon link
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Any public sermon video with captions works.
              </Text>
              <SermonLinkField
                testID="paste-sermon-link-input"
                value={link}
                onChangeText={onChangeLink}
                error={linkError}
              />
              <HowToCopyCard />
            </>
          ) : (
            checked && (
              <>
                <SermonPreview
                  testID="link-preview-sermon"
                  link={shortenLink(checked.url)}
                  title={checked.sermon.title}
                  church={checked.sermon.church}
                  duration={formatDuration(checked.sermon.durationSeconds)}
                />
                <DayCountPicker testID="link-preview-days" value={days} onChange={setDays} />
                <QuickCheckToggle
                  testID="link-preview-quick-check-toggle"
                  value={quickCheck}
                  onChange={setQuickCheck}
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
          disabled={step === 0 && link.trim() === ""}
          onPress={onNext}
        />
      </View>

      {/* Only once Preparing has handed back — never over it. */}
      <CaptionsSheet
        testID="captions-sheet"
        visible={noCaptions && focused}
        onTryAnotherLink={onTryAnotherLink}
        onRemindLater={() => session.exit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 16 },
  body: { gap: 16 },
  action: { paddingBottom: 8 },
});
