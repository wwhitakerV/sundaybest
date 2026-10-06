import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { SheetLayout } from "@/ui/SheetLayout";
import { SFProBody } from "@/ui/typography/SFProBody";
import { BuildSteps } from "../components/BuildSteps";
import { useGenerationSheet } from "../hooks/use-generation-sheet";

const TITLES = {
  building: "Generating your plan",
  ready: "Your plan is ready",
  failed: "Couldn’t build your plan",
} as const;

/**
 * The plan being built, in a half sheet over wherever the reader is: how far
 * along it is, step by step, spinning on the step under way. Ready, it opens
 * the plan; failed, it says why and offers what can be done.
 */
export function GenerationSheetScreen() {
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
    <SheetLayout testID="generation-sheet" title={TITLES[view.kind]}>
      <View style={styles.body}>
        {view.kind === "building" && (
          <SFProBody
            variant="detail"
            tone="textMuted"
          >{`${view.percent}% · This keeps going while you browse.`}</SFProBody>
        )}
        {view.kind === "failed" ? (
          <SFProBody tone="textMuted">{view.reason}</SFProBody>
        ) : (
          <BuildSteps testID="generation-steps" steps={sheet.steps} />
        )}
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
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[24], paddingTop: space[8] },
  actions: { gap: space[8] },
});
