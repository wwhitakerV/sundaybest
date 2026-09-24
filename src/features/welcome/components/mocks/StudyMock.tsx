import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useStepTransition } from "@/hooks/use-step-transition";
import { useTheme } from "@/theme";
import { getBodyElapsedMs, type MockScreenProps } from "./mock-page";
import { MockScroll } from "./MockScroll";
import { PrayBody, ReadBody, ReflectBody, ScriptureBody } from "./StudyBodies";
import { StudyMockHeader } from "./StudyMockHeader";

const PAGE_INSET = 24;

/**
 * Mock of the Daily Study session, stepping exactly as the real `StudyScreen`
 * does: the header and its tracker stay put and update at once, and only the
 * body cross-fades, with the app's own `useStepTransition`. Below the header
 * the page scrolls (`scrollY`), so the story can bring a piece into view
 * before it lifts; each step's page starts at the top.
 */
export function StudyMock({ step, elapsedMs, scrollY = 0, scrollStep = 0 }: MockScreenProps) {
  const theme = useTheme();
  const { renderedStep, bodyStyle } = useStepTransition(step);
  const bodyElapsedMs = getBodyElapsedMs(renderedStep, step, elapsedMs);

  return (
    <View style={styles.page}>
      <View style={[styles.headerBar, { backgroundColor: theme.colors.background }]}>
        <StudyMockHeader testID="mock-study" activeStep={step} />
      </View>
      <View style={styles.scrollArea}>
        {/* The page showing keeps its own scroll until it's gone, even once
            the step has moved on; a new step's page starts at its top. */}
        <MockScroll
          key={renderedStep}
          scrollY={renderedStep === scrollStep ? scrollY : 0}
          style={styles.scrollContent}
        >
          <Animated.View style={bodyStyle}>
            {renderedStep === 0 && <ReadBody elapsedMs={bodyElapsedMs} />}
            {renderedStep === 1 && <ScriptureBody elapsedMs={bodyElapsedMs} />}
            {renderedStep === 2 && <ReflectBody elapsedMs={bodyElapsedMs} />}
            {renderedStep === 3 && <PrayBody elapsedMs={bodyElapsedMs} />}
          </Animated.View>
        </MockScroll>
      </View>
    </View>
  );
}

// The same 24pt sides and 12pt top as `MOCK_PAGE.page`, split so the header
// stays put while the body scrolls beneath it.
const styles = StyleSheet.create({
  page: { flex: 1 },
  // A white bar with room under its step labels, so content scrolling up
  // passes cleanly beneath it.
  headerBar: { paddingHorizontal: PAGE_INSET, paddingTop: 12, paddingBottom: 14, zIndex: 1 },
  // Clips the content scrolling up beneath the header.
  scrollArea: { flex: 1, overflow: "hidden" },
  scrollContent: { paddingHorizontal: PAGE_INSET, paddingTop: 12 },
});
