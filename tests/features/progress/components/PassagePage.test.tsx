import { fireEvent, render, screen } from "@tests/helpers/render";

import { PassagePage } from "@/features/progress/components/PassagePage";

const PASSAGE = {
  planId: "00000000-0000-4000-8000-000000000001",
  planTitle: "Facing Disappointment with Hope",
  dayNumber: 1,
  reference: "Psalm 42:1-5",
  status: "open" as const,
  keyVerse: null,
  reflectionIds: [],
};

describe("PassagePage", () => {
  it("opens Bible translation from the passage's translation pill", () => {
    const onChangeTranslation = jest.fn();
    render(
      <PassagePage
        passage={PASSAGE}
        panel={{ kind: "message", title: "Ready when you are", line: null, action: null }}
        named={false}
        isToday
        translation="BSB"
        onOpen={jest.fn()}
        onChangeTranslation={onChangeTranslation}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Bible translation: BSB" }));

    expect(onChangeTranslation).toHaveBeenCalledTimes(1);
  });
});
