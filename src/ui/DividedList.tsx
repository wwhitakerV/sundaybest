import { Children, Fragment, type ReactNode } from "react";
import { View } from "react-native";

import { Divider } from "./Divider";

export type DividedListProps = {
  children: ReactNode;
  testID?: string;
};

/** Its rows, one under another, with a hairline between each — not above the first or after the last. */
export function DividedList({ children, testID }: DividedListProps) {
  return (
    <View testID={testID}>
      {Children.toArray(children).map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
