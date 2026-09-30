import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { DividedList } from "@/ui/DividedList";

describe("DividedList", () => {
  it("parts its rows with a hairline between each, and none after the last", () => {
    const { toJSON } = render(
      <DividedList testID="a-list">
        <Text>One</Text>
        <Text>Two</Text>
        <Text>Three</Text>
      </DividedList>,
    );

    expect(screen.getByTestId("a-list").children).toHaveLength(5);
    expect(JSON.stringify(toJSON())).toMatch(/One.*Two.*Three/);
  });
});
