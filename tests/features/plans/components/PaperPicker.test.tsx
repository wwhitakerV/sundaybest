import { render, screen, fireEvent } from "@tests/helpers/render";

import { READING_PAPERS } from "@/theme";
import { PaperPicker } from "@/features/plans/components/PaperPicker";

describe("PaperPicker", () => {
  it("offers one swatch per paper, in order", () => {
    render(<PaperPicker testID="paper" selected="white" onSelect={() => undefined} />);

    for (const paper of READING_PAPERS) {
      expect(screen.getByTestId(`paper-${paper.id}`)).toBeVisible();
    }
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  it("labels each swatch with its paper's name", () => {
    render(<PaperPicker testID="paper" selected="white" onSelect={() => undefined} />);

    for (const label of ["White", "Ivory", "Cream", "Sepia", "Dusk", "Night"]) {
      expect(screen.getByRole("radio", { name: label })).toBeVisible();
    }
  });

  it("paints each swatch in its paper's colour", () => {
    render(<PaperPicker testID="paper" selected="white" onSelect={() => undefined} />);

    for (const paper of READING_PAPERS) {
      expect(screen.getByTestId(`paper-${paper.id}`)).toHaveStyle({
        backgroundColor: paper.background,
      });
    }
  });

  it("marks only the selected paper as selected", () => {
    render(<PaperPicker testID="paper" selected="sepia" onSelect={() => undefined} />);

    expect(screen.getByRole("radio", { name: "Sepia" })).toBeSelected();
    expect(screen.getByRole("radio", { name: "White" })).not.toBeSelected();
    expect(screen.getByRole("radio", { name: "Night" })).not.toBeSelected();
  });

  it("calls onSelect with the paper's id when a swatch is pressed", () => {
    const onSelect = jest.fn<void, [string]>();
    render(<PaperPicker testID="paper" selected="white" onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId("paper-night"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("night");
  });

  it("draws a single active border", () => {
    render(<PaperPicker testID="paper" selected="cream" onSelect={() => undefined} />);

    expect(screen.getAllByTestId("paper-indicator")).toHaveLength(1);
  });

  it("puts the border on the selected swatch as soon as the row is laid out, with no slide", () => {
    render(<PaperPicker testID="paper" selected="sepia" onSelect={() => undefined} />);

    fireEvent(screen.getByTestId("paper"), "layout", {
      nativeEvent: { layout: { width: 400, height: 100, x: 0, y: 0 } },
    });

    const swatch = (400 - 2 * 6 - 12 * 5) / 6;
    const sepia = READING_PAPERS.findIndex((paper) => paper.id === "sepia");
    expect(screen.getByTestId("paper-indicator")).toHaveStyle({
      transform: [{ translateX: sepia * (swatch + 12) }],
    });
  });
});
