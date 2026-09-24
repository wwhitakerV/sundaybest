import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { ArrowLeft, X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { useStepTransition } from "@/hooks/use-step-transition";
import { useScrollTo } from "../../hooks/use-scroll-to";
import { useTheme } from "@/theme";
import { getPasteScene } from "../../logic/scenes";
import { CREATE_BUTTON_HEIGHT } from "../lifts/CreateButton";
import { getBodyElapsedMs, type MockScreenProps } from "./mock-page";
import { PasteBody } from "./PasteBody";
import { PlanBody } from "./PlanBody";

const PAGE_INSET = 24;
const HEADER_TOP = 12;
const HEADER_HEIGHT = 54;
/**
 * The fixed header bar's height; the content scrolls beneath it. The stage
 * needs it to know where the scrolling part of the screen starts.
 */
export const NEW_PLAN_HEADER_HEIGHT = HEADER_TOP + HEADER_HEIGHT;

/**
 * Mock of New Plan, stepping exactly as the real `NewPlanScreen` does: the
 * header updates at once (X → back arrow, "1 of 2" → "2 of 2"), the body
 * cross-fades with the app's own `useStepTransition`. "Continue" sits at the
 * bottom of the first step (enabled once the link is in); on the second,
 * "Create my plan" follows the days. Below the header the page scrolls
 * (`scrollY`), so the story can bring each section into view before it lifts.
 */
export function NewPlanMock({ step, elapsedMs, scrollY = 0 }: MockScreenProps) {
  const theme = useTheme();
  const { renderedStep, bodyStyle } = useStepTransition(step);
  const bodyElapsedMs = getBodyElapsedMs(renderedStep, step, elapsedMs);
  const onPaste = step === 0;
  const pasted = !onPaste || getPasteScene(elapsedMs).complete;
  const scrollStyle = useScrollTo(scrollY);

  return (
    <View style={styles.page}>
      <View style={[styles.headerBar, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader
          title="New plan"
          left={
            <HeaderIconButton
              testID="mock-new-plan-leading"
              icon={onPaste ? X : ArrowLeft}
              accessibilityLabel={onPaste ? "Close" : "Back"}
              onPress={() => undefined}
            />
          }
          right={<StepCounter label={onPaste ? "1 of 2" : "2 of 2"} />}
        />
      </View>

      <View style={styles.scrollArea}>
        <Animated.View style={[styles.scrollContent, scrollStyle]}>
          <Animated.View style={bodyStyle}>
            {renderedStep === 0 ? (
              <PasteBody elapsedMs={bodyElapsedMs} />
            ) : (
              <PlanBody elapsedMs={bodyElapsedMs} />
            )}
          </Animated.View>

          {/* "Continue" sits at the bottom of the first step; on the second,
              "Create my plan" follows the days in the body. */}
          {onPaste && (
            <>
              <View style={styles.spacer} />
              <View
                style={[
                  styles.footer,
                  styles.continue,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: pasted ? theme.colors.controlPrimary : theme.colors.background,
                    borderColor: pasted ? theme.colors.controlPrimary : theme.colors.divider,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.button,
                    { color: pasted ? theme.colors.onControlPrimary : theme.colors.textMuted },
                  ]}
                >
                  Continue
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { paddingHorizontal: PAGE_INSET, paddingTop: HEADER_TOP, zIndex: 1 },
  // Clips the content scrolling up beneath the header.
  scrollArea: { flex: 1, overflow: "hidden" },
  scrollContent: { flex: 1, paddingHorizontal: PAGE_INSET, paddingTop: 16, gap: 16 },
  spacer: { flex: 1 },
  footer: { marginBottom: 28 },
  continue: {
    height: CREATE_BUTTON_HEIGHT,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
