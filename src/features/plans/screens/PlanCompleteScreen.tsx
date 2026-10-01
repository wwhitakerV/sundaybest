import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { useModalSession } from "@/hooks/use-modal-session";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The end of a plan, inside the Daily Study session. Every action leaves the session. */
export function PlanCompleteScreen() {
  const session = useModalSession();

  return (
    <Screen testID="plan-complete-screen" padded>
      <ScreenHeader testID="plan-complete" title="Plan complete" />

      <SFProBody>...</SFProBody>

      <Button
        testID="plan-complete-share-button"
        label="Share"
        variant="secondary"
        // Mocked action only — no real share sheet in this navigation build.
        onPress={() => undefined}
      />
      <Button
        testID="plan-complete-plans-button"
        label="Plans"
        onPress={() => session.exitTo("/(tabs)/plans")}
      />
      <Button
        testID="plan-complete-add-sermon-button"
        label="Add sermon"
        variant="secondary"
        onPress={() => session.exitTo("/(plan-creation)/paste-sermon")}
      />
      <Button
        testID="plan-complete-home-button"
        label="Home"
        variant="secondary"
        onPress={() => session.exitTo("/(tabs)/home")}
      />
    </Screen>
  );
}
