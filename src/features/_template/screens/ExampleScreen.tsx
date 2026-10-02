import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";
import { Screen } from "@/ui/organisms/Screen";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { useExampleView } from "../hooks/use-example-view";

/** A screen composes: it reads its view model, renders components, and passes handlers. */
export function ExampleScreen() {
  const view = useExampleView();

  if (!view.found) {
    return (
      <NotFoundScreen
        testID="example-not-found"
        title="This isn't here"
        message="It may have been removed, or the link is out of date."
        actionLabel="Go back"
        onAction={view.goBack}
      />
    );
  }

  return (
    <Screen testID="example-screen" padded>
      <SFProTitle>{view.title}</SFProTitle>
    </Screen>
  );
}
