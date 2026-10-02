import { StyleSheet } from "react-native";
import { render, screen, fireEvent, within } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";

import { FilterPills, type FilterPillsProps } from "@/ui/molecules/FilterPills";

const OPTIONS = [
  { label: "All", count: 4 },
  { label: "In progress", count: 1 },
  { label: "Done", count: 1 },
  { label: "Saved", count: 2 },
] as const;

function renderPills(props: Partial<FilterPillsProps<(typeof OPTIONS)[number]>> = {}) {
  return render(
    <FilterPills
      testID="a-filter-pills"
      options={OPTIONS}
      selected="All"
      onSelect={() => undefined}
      {...props}
    />,
  );
}

describe("FilterPills", () => {
  it("forwards testID to the outermost view", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills")).toBeVisible();
  });

  it("shows each option's label with its count", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills-option-All")).toHaveTextContent("All4");
    expect(screen.getByTestId("a-filter-pills-option-In progress")).toHaveTextContent(
      "In progress1",
    );
    expect(screen.getByTestId("a-filter-pills-option-Saved")).toHaveTextContent("Saved2");
  });

  it("calls onSelect with the pressed option's label", () => {
    const onSelect = jest.fn();
    renderPills({ onSelect });

    fireEvent.press(screen.getByTestId("a-filter-pills-option-Done"));

    expect(onSelect).toHaveBeenCalledWith("Done");
  });

  it("marks only the selected option as selected", () => {
    renderPills({ selected: "Done" });

    expect(screen.getByTestId("a-filter-pills-option-Done")).toBeSelected();
    expect(screen.getByTestId("a-filter-pills-option-All")).not.toBeSelected();
  });

  it("fills no pill: the picked one is outlined instead", () => {
    renderPills({ selected: "Done" });

    for (const option of OPTIONS) {
      const style = StyleSheet.flatten(
        screen.getByTestId(`a-filter-pills-option-${option.label}`).props.style,
      ) as { backgroundColor?: string };
      expect([undefined, "transparent"]).toContain(style.backgroundColor);
    }
  });

  it("sets every label in the text ink, picked or not", () => {
    renderPills({ selected: "Done" });

    expect(screen.getByText("Done")).toHaveStyle({ color: lightTheme.colors.text });
    expect(screen.getByText("All")).toHaveStyle({ color: lightTheme.colors.text });
  });

  it("sets every count in the inactive ink", () => {
    renderPills({ selected: "Done" });

    const done = screen.getByTestId("a-filter-pills-option-Done");
    const all = screen.getByTestId("a-filter-pills-option-All");
    expect(within(done).getByText("1")).toHaveStyle({ color: lightTheme.colors.textInactive });
    expect(within(all).getByText("4")).toHaveStyle({ color: lightTheme.colors.textInactive });
  });

  describe("the outline", () => {
    function measureAll() {
      OPTIONS.forEach((option, index) => {
        fireEvent(screen.getByTestId(`a-filter-pills-option-${option.label}`), "layout", {
          nativeEvent: { layout: { x: index * 80, y: 0, width: 72, height: 36 } },
        });
      });
    }

    it("is not drawn until the picked pill has been measured", () => {
      renderPills();

      expect(screen.queryByTestId("a-filter-pills-indicator")).toBeNull();
    });

    it("is drawn once the pills are measured", () => {
      renderPills();

      measureAll();

      expect(screen.getByTestId("a-filter-pills-indicator")).toBeOnTheScreen();
    });

    it("sits on the picked pill, as wide as it", () => {
      renderPills({ selected: "Done" });

      measureAll();

      expect(screen.getByTestId("a-filter-pills-indicator")).toHaveStyle({
        width: 72,
        transform: [{ translateX: 160 }],
      });
    });

    it("moves to the pill picked next", () => {
      const { rerender } = renderPills({ selected: "Done" });
      measureAll();

      rerender(
        <FilterPills
          testID="a-filter-pills"
          options={OPTIONS}
          selected="Saved"
          onSelect={() => undefined}
        />,
      );

      expect(screen.getByTestId("a-filter-pills-indicator")).toHaveStyle({
        transform: [{ translateX: 240 }],
      });
    });

    it("is a 2pt black line that lets touches through", () => {
      renderPills();

      measureAll();

      const indicator = screen.getByTestId("a-filter-pills-indicator");
      expect(indicator).toHaveStyle({ borderColor: lightTheme.colors.text, borderWidth: 2 });
      expect(indicator).toHaveProp("pointerEvents", "none");
    });
  });

  it("rounds each option fully, as a pill", () => {
    renderPills();

    expect(screen.getByTestId("a-filter-pills-option-All")).toHaveStyle({ borderRadius: 999 });
  });

  it("reaches past its container by its bleed, so it can scroll to the screen's edges", () => {
    renderPills({ bleed: 24 });

    expect(screen.getByTestId("a-filter-pills")).toHaveStyle({ marginHorizontal: -24 });
  });

  it("never gives up its pills' height to a list below it", () => {
    render(
      <FilterPills
        testID="a-row"
        options={[{ label: "All", count: 3 }]}
        selected="All"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-row")).toHaveStyle({ flexGrow: 0, flexShrink: 0 });
  });
});
