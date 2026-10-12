import { fireEvent, render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SearchField } from "@/ui/molecules/SearchField";

const { colors } = lightTheme;

function renderField(props: Partial<Parameters<typeof SearchField>[0]> = {}) {
  const onChange = jest.fn();
  render(
    <SearchField
      testID="search"
      value=""
      onChange={onChange}
      placeholder="Search your plans"
      accessibilityLabel="Search your plans"
      {...props}
    />,
  );
  return { onChange };
}

describe("SearchField", () => {
  it("is the shared field frame, its placeholder in the supporting grey", () => {
    renderField();

    expect(screen.getByTestId("search-field")).toHaveStyle({ minHeight: 52 });
    expect(screen.getByTestId("search").props.placeholderTextColor).toBe(colors.textSupporting);
  });

  it("offers its clear only once something's typed", () => {
    renderField();
    expect(screen.queryByTestId("search-clear")).toBeNull();
  });

  it("clears by emptying the field", () => {
    const { onChange } = renderField({ value: "hope" });

    fireEvent.press(screen.getByTestId("search-clear"));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("clears with the caller's own clear when it has one (New Plan resets its results too)", () => {
    const onClear = jest.fn();
    const { onChange } = renderField({ value: "hope", onClear });

    fireEvent.press(screen.getByTestId("search-clear"));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
