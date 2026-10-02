import { render, screen, fireEvent } from "@tests/helpers/render";

import { ReadingSheet } from "@/features/plans/components/ReadingSheet";

function showSheet(overrides: Partial<Parameters<typeof ReadingSheet>[0]> = {}) {
  const props = {
    visible: true,
    onClose: jest.fn<void, []>(),
    textOffset: 0,
    onTextOffsetChange: jest.fn<void, [number]>(),
    paper: "white" as const,
    onPaperChange: jest.fn<void, [string]>(),
    ...overrides,
  };
  render(<ReadingSheet {...props} />);
  return props;
}

describe("ReadingSheet", () => {
  it("is not shown when it isn't visible", () => {
    showSheet({ visible: false });

    expect(screen.queryByTestId("study-reading-sheet")).toBeNull();
  });

  it("shows the Text size and Paper sections", () => {
    showSheet();

    expect(screen.getByTestId("study-reading-sheet")).toBeVisible();
    expect(screen.getByText("Text size")).toBeVisible();
    expect(screen.getByText("Paper")).toBeVisible();
    expect(screen.getByTestId("study-reading-text-size")).toBeVisible();
    expect(screen.getByTestId("study-reading-paper")).toBeVisible();
  });

  it("asks for a step larger from the scale's increase", () => {
    const props = showSheet({ textOffset: 2 });

    fireEvent.press(screen.getByTestId("study-reading-text-size-increase"));

    expect(props.onTextOffsetChange).toHaveBeenCalledWith(4);
  });

  it("asks for a step smaller from the scale's decrease", () => {
    const props = showSheet({ textOffset: 2 });

    fireEvent.press(screen.getByTestId("study-reading-text-size-decrease"));

    expect(props.onTextOffsetChange).toHaveBeenCalledWith(0);
  });

  it("limits the scale to the store's -4 to 8 range in steps of 2", () => {
    showSheet();

    expect(screen.getAllByTestId(/^study-reading-text-size-tick-/)).toHaveLength(7);
  });

  it("doesn't go past the largest size", () => {
    const props = showSheet({ textOffset: 8 });

    fireEvent.press(screen.getByTestId("study-reading-text-size-increase"));

    expect(props.onTextOffsetChange).not.toHaveBeenCalled();
  });

  it("doesn't go past the smallest size", () => {
    const props = showSheet({ textOffset: -4 });

    fireEvent.press(screen.getByTestId("study-reading-text-size-decrease"));

    expect(props.onTextOffsetChange).not.toHaveBeenCalled();
  });

  it("reports the paper picked", () => {
    const props = showSheet();

    fireEvent.press(screen.getByTestId("study-reading-paper-sepia"));

    expect(props.onPaperChange).toHaveBeenCalledWith("sepia");
  });

  it("shows the current paper as selected", () => {
    showSheet({ paper: "dusk" });

    expect(screen.getByRole("radio", { name: "Dusk" })).toBeSelected();
  });

  it("closes when the scrim is tapped", () => {
    const props = showSheet();

    fireEvent.press(
      screen.getByTestId("study-reading-sheet-scrim", { includeHiddenElements: true }),
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, "Default"],
    [2, "2 points larger"],
    [-4, "4 points smaller"],
  ])("reads the scale at an offset of %i as %s", (textOffset, text) => {
    showSheet({ textOffset });

    expect(screen.getByTestId("study-reading-text-size")).toHaveProp(
      "accessibilityValue",
      expect.objectContaining({ text }),
    );
  });
});
