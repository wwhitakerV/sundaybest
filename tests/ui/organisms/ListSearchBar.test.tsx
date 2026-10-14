import { fireEvent, render, screen } from "@tests/helpers/render";

import { ListSearchBar } from "@/ui/organisms/ListSearchBar";

function renderBar(words = "") {
  const handlers = { onChange: jest.fn(), onLeave: jest.fn(), onClose: jest.fn() };
  render(<ListSearchBar testID="things" label="Search your things" words={words} {...handlers} />);
  return handlers;
}

describe("ListSearchBar", () => {
  it("rides the keyboard, its field holding what's typed", () => {
    renderBar("grace");

    expect(screen.getByTestId("things-search-bar")).toContainElement(
      screen.getByTestId("things-search"),
    );
    expect(screen.getByDisplayValue("grace")).toBeTruthy();
  });

  it("asks to search anything", () => {
    renderBar();

    expect(screen.getByPlaceholderText("Search anything")).toBeTruthy();
  });

  it("passes on what's typed", () => {
    const { onChange } = renderBar();

    fireEvent.changeText(screen.getByLabelText("Search your things"), "hope");

    expect(onChange).toHaveBeenCalledWith("hope");
  });

  it("says when the keyboard's put away", () => {
    const { onLeave } = renderBar();

    fireEvent(screen.getByLabelText("Search your things"), "blur");

    expect(onLeave).toHaveBeenCalled();
  });

  it("closes from its own X beside the field", () => {
    const { onClose } = renderBar("grace");

    fireEvent.press(screen.getByTestId("things-search-close"));

    expect(onClose).toHaveBeenCalled();
  });
});
