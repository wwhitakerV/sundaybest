import { render, screen, fireEvent } from "@tests/helpers/render";

import type { PlanLength } from "@/types/domain";
import { DayCountPicker } from "@/features/plan-creation/components/DayCountPicker";
import { lightTheme } from "@/theme/tokens";

const CHIP = { width: 44, height: 57 };

function renderPicker(
  value: PlanLength = 3,
  onChange: (days: PlanLength) => void = () => undefined,
) {
  return render(<DayCountPicker testID="days" value={value} onChange={onChange} />);
}

/** Lays the seven chips out 50pt apart, as `onLayout` would on a device. */
function measureChips() {
  for (let days = 1; days <= 7; days += 1) {
    fireEvent(screen.getByTestId(`days-${days}`), "layout", {
      nativeEvent: { layout: { x: (days - 1) * 50, y: 0, ...CHIP } },
    });
  }
}

describe("DayCountPicker", () => {
  it("picks a length when its chip is pressed", () => {
    const onChange = jest.fn();
    renderPicker(3, onChange);

    fireEvent.press(screen.getByTestId("days-5"));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("gives every chip the same thin edge, picked or not", () => {
    renderPicker(3);

    for (const days of [1, 3, 7]) {
      expect(screen.getByTestId(`days-${days}`)).toHaveStyle({
        borderWidth: 1,
        borderColor: lightTheme.colors.divider,
      });
    }
  });

  describe("the outline", () => {
    it("isn't drawn until the chips are measured", () => {
      renderPicker(3);

      expect(screen.queryByTestId("days-outline")).toBeNull();
    });

    it("sits on the length picked, in the text ink, letting touches through", () => {
      renderPicker(3);

      measureChips();

      const outline = screen.getByTestId("days-outline");
      expect(outline).toHaveStyle({
        borderColor: lightTheme.colors.text,
        transform: [{ translateX: 100 }],
      });
      expect(outline).toHaveProp("pointerEvents", "none");
    });
  });
});
