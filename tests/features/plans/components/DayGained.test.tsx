import { fireEvent, render, screen } from "@tests/helpers/render";

import { DayGained } from "@/features/plans/components/DayGained";

describe("DayGained", () => {
  it("opens Bible translation from the passage's translation pill", () => {
    const onChangeTranslation = jest.fn();
    render(
      <DayGained
        testID="gained"
        reference="Psalm 42:1-5"
        translation="BSB"
        verse="As the deer pants for streams of water"
        wrote={null}
        onChangeTranslation={onChangeTranslation}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Bible translation: BSB" }));

    expect(onChangeTranslation).toHaveBeenCalledTimes(1);
  });
});
