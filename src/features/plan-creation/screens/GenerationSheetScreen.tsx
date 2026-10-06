import { ScrollView, StyleSheet, View } from "react-native";
import { CircleAlert, Sparkles, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";

import { getSurfaceTheme, space, ThemeScope, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SheetGrabber } from "@/ui/atoms/SheetGrabber";
import { FORM_SHEET_GRABBER_TOP } from "@/ui/SheetLayout";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { BuildSteps } from "../components/BuildSteps";
import { GenerationSheetHeader } from "../components/GenerationSheetHeader";
import type { GenerationBarView } from "../logic/generation-bar";
import { useGenerationSheet } from "../hooks/use-generation-sheet";
import { GenerationPreviewButton } from "../dev/GenerationPreviewButton";

/** A finished sheet's mark — its sparkle, or a failure's alert: large, the page's one mark. */
const STATE_MARK = 64;

/**
 * The plan being built, in a half sheet over wherever the reader is — one
 * solid colour top to bottom, as the bar is: the primary control's while
 * building, green once ready. Building, its head says what's happening and
 * how far along, its body each step and what it does or did; ready, it's
 * only a large sparkle, the news, and Open, centred in white; failed, the
 * same layout — a large mark, the news, why, and what can be done, with a
 * way out always. Swiped down, it closes.
 */
export function GenerationSheetScreen() {
  const theme = useTheme();
  const sheet = useGenerationSheet();
  const { view } = sheet;

  if (!view) {
    return (
      <NotFoundScreen
        testID="generation-sheet-empty"
        title="Nothing’s being created"
        message="Your plans are waiting in Plans."
        actionLabel="Close"
        onAction={sheet.close}
      />
    );
  }

  const surface = getSurfaceTheme(theme, view.kind === "ready" ? "success" : "primary");

  return (
    <ThemeScope theme={surface}>
      <ScrollView
        testID="generation-sheet"
        style={[styles.sheet, { backgroundColor: surface.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grabber}>
          <SheetGrabber testID="generation-sheet-grabber" />
        </View>
        {view.kind === "ready" ? (
          <ReadyView onOpen={sheet.open} />
        ) : view.kind === "failed" ? (
          <FailedView view={view} sheet={sheet} />
        ) : (
          <>
            <GenerationSheetHeader testID="generation-sheet-header" view={view} />
            <View style={styles.body}>
              <BuildSteps testID="generation-steps" steps={sheet.steps} />
            </View>
          </>
        )}
        {/* DEVELOPMENT ONLY: steps through the states while the sheet is open. */}
        <View style={styles.preview}>
          <GenerationPreviewButton testID="generation-sheet-preview" />
        </View>
      </ScrollView>
    </ThemeScope>
  );
}

/** The plan ready: a large sparkle, the news, and Open, centred — all in the green's white. */
function ReadyView({ onOpen }: { onOpen: () => void }) {
  return (
    <CentredState
      testID="generation-sheet-ready"
      mark={Sparkles}
      markTestID="generation-sheet-ready-sparkle"
      title="Your plan is ready"
    >
      <Button testID="generation-sheet-open" label="Open" onPress={onOpen} />
    </CentredState>
  );
}

/** The build failed: laid out as the ready sheet is — a large mark, the news, why, and what can be done. */
function FailedView({
  view,
  sheet,
}: {
  view: Extract<GenerationBarView, { kind: "failed" }>;
  sheet: ReturnType<typeof useGenerationSheet>;
}) {
  return (
    <CentredState
      testID="generation-sheet-failed"
      mark={CircleAlert}
      markTestID="generation-sheet-failed-mark"
      title="Couldn’t create your plan"
      message={view.reason}
    >
      {view.action === "retry" ? (
        <Button testID="generation-sheet-retry" label="Try again" onPress={sheet.retry} />
      ) : (
        <Button
          testID="generation-sheet-choose-another"
          label="Choose another sermon"
          onPress={sheet.chooseAnother}
        />
      )}
      <Button
        testID="generation-sheet-dismiss"
        label="Dismiss"
        variant="secondary"
        onPress={sheet.dismiss}
      />
    </CentredState>
  );
}

/** A finished sheet, centred: its large mark, the news, why (if anything), then its buttons. */
function CentredState({
  testID,
  mark: Mark,
  markTestID,
  title,
  message,
  children,
}: {
  testID: string;
  mark: LucideIcon;
  markTestID: string;
  title: string;
  message?: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.state}>
      <View testID={markTestID}>
        <Mark size={STATE_MARK} color={theme.colors.accent} strokeWidth={theme.icon.strokeWidth} />
      </View>
      <SFProTitle tone="text" accessibilityRole="header" style={styles.centred}>
        {title}
      </SFProTitle>
      {message ? (
        <SFProBody tone="textMuted" style={styles.centred}>
          {message}
        </SFProBody>
      ) : null}
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  grabber: { paddingTop: FORM_SHEET_GRABBER_TOP },
  content: { flexGrow: 1, paddingBottom: space[40] },
  preview: { marginTop: space[24] },
  body: { gap: space[24], paddingTop: space[8], paddingHorizontal: PAGE_INSET },
  state: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space[20],
    paddingTop: space[40],
    paddingHorizontal: PAGE_INSET,
  },
  centred: { textAlign: "center" },
  // The buttons keep the page inset's width, centred under the news.
  actions: { alignSelf: "stretch", marginTop: space[12], gap: space[12] },
});
