import { Redirect } from "expo-router";

import { useCurrentUserQuery } from "@/core/api/queries";
import { WelcomeScreen } from "@/features/welcome";
import { LoadingScreen } from "@/ui/organisms/LoadingScreen";

/** The API owns onboarding state. Returning anonymous users skip Welcome. */
export default function IndexScreen() {
  const me = useCurrentUserQuery();

  if (me.isPending) return <LoadingScreen />;
  if (me.data?.user.onboardedAt) return <Redirect href="/(tabs)/home" />;

  // If the API is temporarily unreachable, leave Welcome usable rather than
  // trapping the whole app. Its action will surface the mutation failure.
  return <WelcomeScreen />;
}
