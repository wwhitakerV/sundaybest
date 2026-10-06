import { ScrollView, StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { BuildSteps } from "../components/BuildSteps";
import { GenerationSheetHeader } from "../components/GenerationSheetHeader";
import { useGenerationSheet } from "../hooks/use-generation-sheet";

/**
 * The plan being built, in a half sheet over wherever the reader is: a black
 * head with how far along it is, then its steps, spinning on the step under
 * way. Ready, it opens the plan; failed, it offers what can be done — and a
 * way out, always.
 */
export function GenerationSheetScreen() {
  const theme = useTheme();
  const sheet = useGenerationSheet();
  const { view } = sheet;

  if (!view) {
    return (
      <NotFoundScreen
        testID="generation-sheet-empty"
        title="Nothing’s being built"
        message="Your plans are waiting in Plans."
        actionLabel="Close"
        onAction={sheet.close}
      />
    );
  }

  return (
    <ScrollView
      testID="generation-sheet"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <GenerationSheetHeader
        testID="generation-sheet-header"
        view={view}
        step={sheet.step}
        onClose={sheet.close}
      />
      <View style={styles.body}>
        {view.kind !== "failed" && <BuildSteps testID="generation-steps" steps={sheet.steps} />}
        <View style={styles.actions}>
          {view.kind === "ready" && (
            <Button testID="generation-sheet-open" label="Open plan" onPress={sheet.open} />
          )}
          {view.kind === "failed" && (
            <>
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
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space[40] },
  body: { gap: space[24], paddingTop: space[24], paddingHorizontal: PAGE_INSET },
  actions: { gap: space[8] },
});
