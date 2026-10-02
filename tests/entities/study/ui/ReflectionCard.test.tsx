import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { ReflectionCard } from "@/entities/study/ui/ReflectionCard";

function renderCard() {
  return render(
    <ReflectionCard question="Where did you see grace today?" testID="reflection">
      <Text>The answer box</Text>
    </ReflectionCard>,
  );
}

describe("ReflectionCard", () => {
  it("shows the question", () => {
    renderCard();

    expect(screen.getByText("Where did you see grace today?")).toBeVisible();
  });

  it("puts the children between the question and the privacy line", () => {
    renderCard();

    expect(screen.getByTestId("reflection")).toHaveTextContent(
      /Where did you see grace today\?.*The answer box.*Only you ever see this\./,
    );
  });

  it("tells the reader that only they see it", () => {
    renderCard();

    expect(screen.getByText("Only you ever see this.")).toBeVisible();
  });
});
