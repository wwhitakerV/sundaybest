import { StyleSheet } from "react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";

import { DayTile, type DayTileLook } from "@/ui/molecules/DayTile";
import { lightTheme } from "@/theme/tokens";

const { colors } = lightTheme;

function look(overrides: Partial<DayTileLook> = {}): DayTileLook {
  return {
    number: 2,
    date: "Sep 23",
    mark: null,
    today: false,
    accessibilityLabel: "Day 2",
    ...overrides,
  };
}

function renderTile(tile: DayTileLook, selected = false, onPress = () => undefined) {
  return render(<DayTile testID="a-day" look={tile} selected={selected} onPress={onPress} />);
}

describe("DayTile", () => {
  it("sets a finished day on a soft off-white surface", () => {
    renderTile(look({ mark: "done" }));

    expect(screen.getByTestId("a-day")).toHaveStyle({
      backgroundColor: colors.surface,
      borderRadius: 16,
    });
  });

  it("gives a day still to come no surface, and no day an edge of its own — the rail outlines the one picked", () => {
    renderTile(look({ mark: "locked" }), true);

    const style = StyleSheet.flatten(screen.getByTestId("a-day").props.style) as {
      backgroundColor?: string;
    };
    expect(style.backgroundColor).toBe("transparent");
    expect(style).not.toHaveProperty("borderWidth");
  });

  it("ticks a finished day, in dark type", () => {
    renderTile(look({ mark: "done" }));

    expect(screen.getByTestId("a-day-done")).toBeOnTheScreen();
    expect(screen.getByText("2")).toHaveStyle({ color: colors.text });
  });

  it("gives a finished day's date more presence than a day to come's — secondary, not ghosted", () => {
    renderTile(look({ mark: "done" }));

    expect(screen.getByText("Sep 23")).toHaveStyle({ color: colors.textInactive });
  });

  it("lets its mark breathe above its number", () => {
    renderTile(look({ mark: "locked" }));

    expect(screen.getByTestId("a-day-mark")).toHaveStyle({ marginBottom: 6 });
  });

  it("dots the day the plan's on in SundayBest red", () => {
    renderTile(look({ today: true }));

    expect(screen.getByTestId("a-day-today")).toHaveStyle({ backgroundColor: colors.accent });
  });

  it("quiets a locked day — its number and date muted, under a tiny lock", () => {
    renderTile(look({ mark: "locked" }));

    expect(screen.getByTestId("a-day-locked")).toBeOnTheScreen();
    expect(screen.getByText("2")).toHaveStyle({ color: colors.textMuted });
    expect(screen.getByText("Sep 23")).toHaveStyle({ color: colors.textMuted });
  });

  it("sets its date small, in capitals", () => {
    renderTile(look());

    expect(screen.getByText("Sep 23")).toHaveStyle({ textTransform: "uppercase" });
  });

  it("is picked by a tap", () => {
    const onPress = jest.fn();
    renderTile(look(), false, onPress);

    fireEvent.press(screen.getByTestId("a-day"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
