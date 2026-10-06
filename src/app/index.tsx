import { Redirect } from "expo-router";

import { useCurrentUserQuery } from "@/core/api/queries";
import { WelcomeScreen } from "@/features/welcome";
import { LoadingScreen } from "@/ui/organisms/LoadingScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";

/** The API owns onboarding state. Returning anonymous users skip Welcome. */
export default function IndexScreen() {
  const me = useCurrentUserQuery();

  // The launch picture, as the native splash lifts — never a blank screen.
  // Only the first lookup: a retry after a failure keeps the error in place.
  const retrying = me.errorUpdateCount > 0;
  if (me.isPending && !retrying) return <LoadingScreen />;
  if (me.data?.user.onboardedAt) return <Redirect href="/(tabs)/home" />;

  // Welcome only for a reader the server says is new. A failed lookup is not
  // an answer: sending a returning reader to Welcome would be wrong, so offer
  // the request again instead.
  if (me.isError || me.isPending) {
    return (
      <ScreenLoadError
        testID="launch-error"
        title="Couldn’t reach SundayBest"
        onRetry={() => void me.refetch()}
      />
    );
  }

  return <WelcomeScreen />;
}
