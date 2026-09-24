import { headerButtonEntrance } from "@/ui/header-button-entrance";

// Under Jest the delayed animations come back as Reanimated animation
// objects; `current` is the value each one settles on.
describe("headerButtonEntrance", () => {
  it("starts a little small, hidden, and out to the left for a button on the left", () => {
    const { initialValues } = headerButtonEntrance("leading")();

    expect(initialValues).toEqual({
      opacity: 0,
      transform: [{ translateX: -11 }, { scale: 0.8 }],
    });
  });

  it("starts out to the right for a button on the right", () => {
    const { initialValues } = headerButtonEntrance("trailing")();

    expect(initialValues.transform).toContainEqual({ translateX: 11 });
  });

  it("settles in place, at full size, fully shown", () => {
    const { animations } = headerButtonEntrance("trailing")();

    expect(animations).toMatchObject({
      opacity: { current: 1 },
      transform: [{ translateX: { current: 0 } }, { scale: { current: 1 } }],
    });
  });
});
