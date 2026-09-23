import { ArrowLeft } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";

export type SettingsSubpageHeaderProps = {
  title: string;
  onBack: () => void;
  testID: string;
};

/** Shared by every Settings subpage: Back + the page title. */
export function SettingsSubpageHeader({ title, onBack, testID }: SettingsSubpageHeaderProps) {
  return (
    <ScreenHeader
      testID={testID}
      title={title}
      left={
        <HeaderIconButton
          testID={`${testID}-back-button`}
          icon={ArrowLeft}
          accessibilityLabel="Back"
          onPress={onBack}
        />
      }
    />
  );
}
