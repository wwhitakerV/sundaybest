import { useRouter } from "expo-router";

import { Screen } from "@/ui/organisms/Screen";
import { SettingsSubpageHeader } from "./SettingsSubpageHeader";
import { SFProBody } from "@/ui/typography/SFProBody";

export type SettingsSubpageProps = {
  /** Base testID: the screen is `${testID}-screen`, the header `${testID}`. */
  testID: string;
  title: string;
};

/** The shared shell of every Settings subpage: Back + title, then its body. */
export function SettingsSubpage({ testID, title }: SettingsSubpageProps) {
  const router = useRouter();

  return (
    <Screen testID={`${testID}-screen`} padded>
      <SettingsSubpageHeader testID={testID} title={title} onBack={() => router.back()} />

      <SFProBody>...</SFProBody>
    </Screen>
  );
}
