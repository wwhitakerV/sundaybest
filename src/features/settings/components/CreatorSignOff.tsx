import { View } from "react-native";

import { space } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type CreatorSignOffProps = { name: string; role: string; testID: string };

/** How the letter ends: signed with his name in the editorial face, and what he does. */
export function CreatorSignOff({ name, role, testID }: CreatorSignOffProps) {
  return (
    <View testID={testID} style={{ gap: space[20] }}>
      <Divider />
      <View style={{ gap: space[4] }}>
        <SerifTitle>{name}</SerifTitle>
        <SFProBody variant="detail" tone="textSupporting">
          {role}
        </SFProBody>
      </View>
    </View>
  );
}
